from datetime import datetime, timedelta, time
from django.utils import timezone
import pytz
from DailyRemainder.models import Alarm, AlarmOccurrence


def generate_occurrences_for_alarm(alarm, for_date):
    """
    Generate alarm occurrences for a specific date.
    
    Args:
        alarm: Alarm instance
        for_date: date object for which to generate occurrences
    
    Returns:
        List of AlarmOccurrence objects created
    """
    if not alarm.is_active:
        return []

    # Check date boundaries
    if for_date < alarm.start_date:
        return []
    
    if alarm.end_date and for_date > alarm.end_date:
        return []

    # Check custom weekdays (Mon/Wed/Fri patterns)
    if alarm.custom_weekdays:
        # weekday() returns 0=Monday, 6=Sunday
        if for_date.weekday() not in alarm.custom_weekdays:
            return []
    # Check interval days (only if custom_weekdays not set)
    elif (for_date - alarm.start_date).days % alarm.interval_days != 0:
        return []

    # Handle time window
    start_time = alarm.start_time
    
    # Default to end of day if end_time not specified
    end_time = alarm.end_time if alarm.end_time else time(23, 59, 59)

    # Get timezone
    tz = pytz.timezone(alarm.timezone)
    
    # Create datetime objects
    start_dt = datetime.combine(for_date, start_time)
    end_dt = datetime.combine(for_date, end_time)

    occurrences = []
    
    # Handle single dose per day
    if alarm.times_per_day == 1:
        scheduled_at = tz.localize(start_dt)
        obj, _ = AlarmOccurrence.objects.get_or_create(
            alarm=alarm,
            scheduled_at=scheduled_at,
        )
        occurrences.append(obj)
    else:
        # Multiple doses - distribute evenly
        delta = (end_dt - start_dt) / (alarm.times_per_day - 1)
        
        for i in range(alarm.times_per_day):
            scheduled_dt = start_dt + delta * i
            scheduled_at = tz.localize(scheduled_dt)
            obj, _ = AlarmOccurrence.objects.get_or_create(
                alarm=alarm,
                scheduled_at=scheduled_at,
            )
            occurrences.append(obj)

    return occurrences