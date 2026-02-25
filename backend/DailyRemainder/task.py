# DailyRemainder/tasks.py
from celery import shared_task
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Q
from .models import Alarm, AlarmOccurrence, DeviceToken
from .services.occurance_generator import generate_occurrences_for_alarm


@shared_task
def generate_daily_occurrences():
    """
    Generate alarm occurrences for all active alarms for today.
    This task should run daily at midnight.
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
    Check for scheduled occurrences that are past their time and mark them as missed.
    This task should run every 30 minutes.
    """
    # Find occurrences that are scheduled but past their time (with 10 min grace period)
    cutoff_time = timezone.now() - timedelta(minutes=10)
    
    missed_occurrences = AlarmOccurrence.objects.filter(
        status=AlarmOccurrence.STATUS_SCHEDULED,
        scheduled_at__lt=cutoff_time
    )
    
    count = missed_occurrences.count()
    missed_occurrences.update(status=AlarmOccurrence.STATUS_MISSED)
    
    return f"Marked {count} occurrences as missed"


@shared_task
def send_reminder_notifications():
    """
    Send push notifications for upcoming occurrences (5-10 minutes in advance).
    This task should run every 5 minutes.
    """
    try:
        from utils.firebase import send_notification
    except ImportError:
        return "Firebase not configured - skipping notifications"
    
    now = timezone.now()
    start_window = now + timedelta(minutes=5)
    end_window = now + timedelta(minutes=10)
    
    # Find upcoming occurrences that need notifications
    upcoming_occurrences = AlarmOccurrence.objects.filter(
        status=AlarmOccurrence.STATUS_SCHEDULED,
        scheduled_at__gte=start_window,
        scheduled_at__lte=end_window
    ).select_related('alarm__medicine__user')
    
    notifications_sent = 0
    for occurrence in upcoming_occurrences:
        user = occurrence.alarm.medicine.user
        medicine_name = occurrence.alarm.medicine.name
        scheduled_time = occurrence.scheduled_at.strftime('%I:%M %p')
        
        # Get user's active device tokens
        tokens = DeviceToken.objects.filter(
            user=user,
            is_active=True
        )
        
        for device_token in tokens:
            try:
                success = send_notification(
                    token=device_token.token,
                    title=f"Medication Reminder: {medicine_name}",
                    body=f"Time to take your medicine at {scheduled_time}",
                    data={
                        'occurrence_id': str(occurrence.id),
                        'alarm_id': str(occurrence.alarm.id),
                        'medicine_name': medicine_name,
                        'scheduled_at': occurrence.scheduled_at.isoformat(),
                    }
                )
                if success:
                    notifications_sent += 1
            except Exception as e:
                # Log error but continue with other notifications
                print(f"Error sending notification to {device_token.token}: {str(e)}")
    
    return f"Sent {notifications_sent} notifications for {upcoming_occurrences.count()} occurrences"