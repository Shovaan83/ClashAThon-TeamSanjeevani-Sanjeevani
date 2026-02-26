import logging
from celery import shared_task
from datetime import date, timedelta
from django.utils import timezone
from .models import Alarm, AlarmOccurrence, DeviceToken
from .services.occurance_generator import generate_occurrences_for_alarm

logger = logging.getLogger('DailyRemainder.tasks')


def _ensure_firebase():
    """
    Attempt to initialise Firebase if it is not already running.
    Returns (send_notification, TokenUnregisteredException) or (None, None).
    """
    try:
        from utils.firebase import (
            send_notification,
            TokenUnregisteredException,
            is_firebase_available,
            initialize_firebase,
        )
    except ImportError:
        logger.error("Firebase module could not be imported")
        return None, None

    if not is_firebase_available():
        logger.info("Firebase not yet initialised — attempting init now …")
        initialize_firebase()

    if not is_firebase_available():
        logger.error("Firebase initialisation failed — push notifications disabled")
        return None, None

    return send_notification, TokenUnregisteredException


@shared_task(name='DailyRemainder.tasks.generate_daily_occurrences')
def generate_daily_occurrences():
    """
    Generate alarm occurrences for all active alarms for today.
    Scheduled: daily at midnight via Celery Beat.
    """
    today = date.today()
    active_alarms = Alarm.objects.filter(is_active=True)

    total_generated = 0
    for alarm in active_alarms:
        occurrences = generate_occurrences_for_alarm(alarm, today)
        total_generated += len(occurrences)

    logger.info("Generated %d occurrences for %d alarms", total_generated, active_alarms.count())
    return f"Generated {total_generated} occurrences for {active_alarms.count()} alarms"


@shared_task(name='DailyRemainder.tasks.check_missed_occurrences')
def check_missed_occurrences():
    """
    Mark SCHEDULED occurrences as MISSED if they are 30+ minutes past their
    scheduled time AND have already been notified (or are old enough that the
    notification window has definitely passed).

    Scheduled: every 30 minutes via Celery Beat.
    """
    now = timezone.now()

    # Occurrences that were notified but never acted on — missed after 30 min
    notified_cutoff = now - timedelta(minutes=30)
    missed_notified = AlarmOccurrence.objects.filter(
        status=AlarmOccurrence.STATUS_SCHEDULED,
        notified=True,
        scheduled_at__lt=notified_cutoff,
    )

    # Occurrences that were NEVER notified and are very old (60 min) —
    # the notification window has long passed; mark missed as a safety net.
    unnotified_cutoff = now - timedelta(minutes=60)
    missed_unnotified = AlarmOccurrence.objects.filter(
        status=AlarmOccurrence.STATUS_SCHEDULED,
        notified=False,
        scheduled_at__lt=unnotified_cutoff,
    )

    count_n = missed_notified.update(status=AlarmOccurrence.STATUS_MISSED)
    count_u = missed_unnotified.update(status=AlarmOccurrence.STATUS_MISSED)
    total = count_n + count_u

    logger.info(
        "Marked %d occurrences as missed (%d notified, %d unnotified-stale)",
        total, count_n, count_u,
    )
    return f"Marked {total} occurrences as missed"


@shared_task(name='DailyRemainder.tasks.send_reminder_notifications')
def send_reminder_notifications():
    """
    Send FCM push notifications for occurrences that:
      • are still SCHEDULED
      • have NOT been notified yet
      • have a scheduled_at within  [now − 5 min,  now + 10 min]

    The backward look-behind of 5 minutes ensures that if the Celery beat
    cycle fires slightly *after* the exact scheduled time the occurrence is
    still picked up.

    Uses the ``notified`` flag on AlarmOccurrence to avoid duplicate pushes.
    Scheduled: every 2 minutes via Celery Beat.
    """
    send_notification, TokenUnregisteredException = _ensure_firebase()
    if send_notification is None:
        return "Firebase unavailable — skipping notifications"

    now = timezone.now()
    window_start = now - timedelta(minutes=5)   # look 5 min into the past
    window_end = now + timedelta(minutes=10)     # look 10 min into the future

    upcoming = AlarmOccurrence.objects.filter(
        status=AlarmOccurrence.STATUS_SCHEDULED,
        notified=False,
        scheduled_at__gte=window_start,
        scheduled_at__lte=window_end,
    ).select_related('alarm__medicine__user')

    logger.info(
        "Notification window [%s … %s] — %d candidate occurrence(s)",
        window_start.isoformat(), window_end.isoformat(), upcoming.count(),
    )

    if not upcoming.exists():
        return "No upcoming occurrences in window"

    notifications_sent = 0
    stale_tokens_deactivated = 0

    for occurrence in upcoming:
        user = occurrence.alarm.medicine.user
        medicine_name = occurrence.alarm.medicine.name

        # Format the scheduled time in the alarm's local timezone (e.g. Asia/Kathmandu)
        import pytz as _pytz
        alarm_tz = _pytz.timezone(occurrence.alarm.timezone)
        local_scheduled = occurrence.scheduled_at.astimezone(alarm_tz)
        scheduled_time = local_scheduled.strftime('%I:%M %p')

        active_tokens = DeviceToken.objects.filter(user=user, is_active=True)

        if not active_tokens.exists():
            logger.warning(
                "No active device tokens for user %s (occurrence %s)",
                user.id, occurrence.id,
            )
            continue

        sent_for_occurrence = False

        for device_token in active_tokens:
            try:
                success = send_notification(
                    token=device_token.token,
                    title=f"Time for {medicine_name}",
                    body=f"Your {medicine_name} dose is scheduled at {scheduled_time}. Don't miss it!",
                    data={
                        'occurrence_id': str(occurrence.id),
                        'alarm_id': str(occurrence.alarm.id),
                        'medicine_name': medicine_name,
                        'scheduled_at': occurrence.scheduled_at.isoformat(),
                        'type': 'medication_reminder',
                    },
                )
                if success:
                    notifications_sent += 1
                    sent_for_occurrence = True
                    logger.info(
                        "Sent notification for occurrence %s → user %s token …%s",
                        occurrence.id, user.id, device_token.token[-8:],
                    )

            except TokenUnregisteredException:
                device_token.is_active = False
                device_token.save(update_fields=['is_active'])
                stale_tokens_deactivated += 1
                logger.warning(
                    "Deactivated stale token for user %s: …%s",
                    user.id, device_token.token[-8:],
                )

            except Exception as e:
                logger.error(
                    "Error sending to token …%s: %s",
                    device_token.token[-8:], str(e),
                )

        # Mark as notified so we don't send again
        if sent_for_occurrence:
            occurrence.notified = True
            occurrence.save(update_fields=['notified'])

    result = (
        f"Sent {notifications_sent} notifications for {upcoming.count()} upcoming occurrences; "
        f"deactivated {stale_tokens_deactivated} stale tokens"
    )
    logger.info(result)
    return result
