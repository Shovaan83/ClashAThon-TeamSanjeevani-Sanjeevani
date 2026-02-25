from django.db import models
from django.core.exceptions import ValidationError
from accounts.models import CustomUser


# -------------------------
# Medicine
# -------------------------
class Medicine(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="medicines",
    )

    name = models.CharField(max_length=128)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# -------------------------
# Alarm (RULE)
# -------------------------
class Alarm(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="alarms",
    )

    # Date boundaries
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    # Time window
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)

    times_per_day = models.PositiveIntegerField()

    # Scheduling strategy
    interval_days = models.PositiveIntegerField(
        default=1,
        help_text="1=daily, 2=every 2 days, 7=weekly",
    )

    # Optional: Mon/Wed/Fri schedules (0=Mon .. 6=Sun)
    custom_weekdays = models.JSONField(
        null=True,
        blank=True,
        help_text="List of integers [0..6]",
    )

    timezone = models.CharField(
        max_length=64,
        default="Asia/Kathmandu",
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # -------------------------
    # Validation
    # -------------------------
    def clean(self):
        # times_per_day
        if self.times_per_day < 1:
            raise ValidationError("times_per_day must be >= 1")

        # date range
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError("end_date must be after start_date")

        # weekday vs interval
        if self.custom_weekdays and self.interval_days != 1:
            raise ValidationError(
                "custom_weekdays cannot be combined with interval_days"
            )

        # validate weekdays
        if self.custom_weekdays:
            if not isinstance(self.custom_weekdays, list):
                raise ValidationError("custom_weekdays must be a list")

            for day in self.custom_weekdays:
                if not isinstance(day, int) or not 0 <= day <= 6:
                    raise ValidationError(
                        "custom_weekdays values must be integers 0..6"
                    )

        # time window validation
        if self.end_time:
            start_minutes = self.start_time.hour * 60 + self.start_time.minute
            end_minutes = self.end_time.hour * 60 + self.end_time.minute

            if end_minutes <= start_minutes:
                raise ValidationError(
                    "end_time must be after start_time"
                )

            total_minutes = end_minutes - start_minutes

            if self.times_per_day > total_minutes:
                raise ValidationError(
                    "times_per_day does not fit in time window"
                )

    def __str__(self):
        return f"{self.medicine.name} ({self.times_per_day}x/day)"


# -------------------------
# Alarm Occurrence (EVENT)
# -------------------------
class AlarmOccurrence(models.Model):
    STATUS_SCHEDULED = "scheduled"
    STATUS_TAKEN = "taken"
    STATUS_MISSED = "missed"
    STATUS_SKIPPED = "skipped"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_TAKEN, "Taken"),
        (STATUS_MISSED, "Missed"),
        (STATUS_SKIPPED, "Skipped"),
    ]

    alarm = models.ForeignKey(
        Alarm,
        on_delete=models.CASCADE,
        related_name="occurrences",
    )

    scheduled_at = models.DateTimeField()
    taken_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_SCHEDULED,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("alarm", "scheduled_at")
        indexes = [
            models.Index(fields=["scheduled_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.alarm} @ {self.scheduled_at}"


# -------------------------
# Device Token
# -------------------------
class DeviceToken(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="device_tokens",
    )

    token = models.CharField(max_length=255)
    platform = models.CharField(
        max_length=16,
        choices=[("android", "Android"), ("ios", "iOS")],
    )

    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "platform", "token")

    def __str__(self):
        return f"{self.user_id} - {self.platform}"