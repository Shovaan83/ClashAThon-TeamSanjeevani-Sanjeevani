from celery import shared_task
from datetime import date, timedelta
from django.utils import timezone
from .models import Alarm, AlarmOccurrence, DeviceToken
from .services.occurance_generator import generate_occurrences_for_alarm


@shared_task
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

    return f"Generated {total_generated} occurrences for {active_alarms.count()} alarms"


@shared_task
def check_missed_occurrences():
    """
    Mark any SCHEDULED occurrences as MISSED if they are 10+ minutes past their
    scheduled time.
    Scheduled: every 30 minutes via Celery Beat.
    """
    cutoff_time = timezone.now() - timedelta(minutes=10)

    missed_qs = AlarmOccurrence.objects.filter(
        status=AlarmOccurrence.STATUS_SCHEDULED,
        scheduled_at__lt=cutoff_time,
    )
    count = missed_qs.count()
    missed_qs.update(status=AlarmOccurrence.STATUS_MISSED)

    return f"Marked {count} occurrences as missed"


@shared_task
def send_reminder_notifications():
    """
    Send FCM push notifications for occurrences due in the next 5-10 minutes.
    Works when the phone screen is off or the app is killed:
      - Android: AndroidConfig(priority='high') wakes the device via FCM.
      - iOS:     apns-priority=10 + content_available=True wakes the app via APNs.
    Stale (unregistered) tokens are automatically deactivated.
    Scheduled: every 5 minutes via Celery Beat.
    """
    try:
        from utils.firebase import send_notification, TokenUnregisteredException, is_firebase_available
    except ImportError:
        return "Firebase module not available — skipping notifications"

    if not is_firebase_available():
        return "Firebase not initialized — skipping notifications"

    now = timezone.now()
    window_start = now + timedelta(minutes=5)
    window_end = now + timedelta(minutes=10)

    upcoming = AlarmOccurrence.objects.filter(
        status=AlarmOccurrence.STATUS_SCHEDULED,
        scheduled_at__gte=window_start,
        scheduled_at__lte=window_end,
    ).select_related('alarm__medicine__user')

    notifications_sent = 0
    stale_tokens_deactivated = 0

    for occurrence in upcoming:
        user = occurrence.alarm.medicine.user
        medicine_name = occurrence.alarm.medicine.name
        scheduled_time = occurrence.scheduled_at.strftime('%I:%M %p')

        active_tokens = DeviceToken.objects.filter(user=user, is_active=True)

        for device_token in active_tokens:
            try:
                success = send_notification(
                    token=device_token.token,
                    title=f"💊 Time for {medicine_name}",
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

            except TokenUnregisteredException:
                # FCM told us this token is no longer valid — deactivate it so we
                # don't keep sending to it (also avoids FCM quota waste).
                device_token.is_active = False
                device_token.save(update_fields=['is_active'])
                stale_tokens_deactivated += 1
                print(f"Deactivated stale token for user {user.id}: {device_token.token[:20]}...")

            except Exception as e:
                print(f"Error sending to token {device_token.token[:20]}...: {str(e)}")

    return (
        f"Sent {notifications_sent} notifications for {upcoming.count()} upcoming occurrences; "
        f"deactivated {stale_tokens_deactivated} stale tokens"
    )
