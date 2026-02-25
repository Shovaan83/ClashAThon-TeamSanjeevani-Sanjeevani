# from django.db import models



# class Medicine(models.Model):
#     user = models.ForeignKey(
#         "accounts.User",
#         on_delete=models.CASCADE,
#         related_name="medicines",
#     )

#     name = models.CharField(max_length=128)
#     duration = models.IntegerField()

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return self.name
    

# class Alarm(models.Model):
#     medicine = models.ForeignKey(
#         Medicine,
#         on_delete=models.CASCADE,
#         related_name="alarms",
#     )

#     # Date boundaries
#     start_date = models.DateField()
#     end_date = models.DateField(null=True, blank=True)

#     # Time window in a day
#     start_time = models.TimeField()
#     end_time = models.TimeField(null=True, blank=True)

#     times_per_day = models.PositiveIntegerField()

#     # Scheduling strategy
#     interval_days = models.PositiveIntegerField(
#         default=1,
#         help_text="1=daily, 2=every 2 days, 7=weekly"
#     )

#     # Optional: Mon/Wed/Fri style
#     custom_weekdays = models.JSONField(
#         null=True,
#         blank=True,
#         help_text="List of weekdays [0=Mon .. 6=Sun]"
#     )

#     timezone = models.CharField(
#         max_length=64,
#         default="Asia/Kathmandu"
#     )

#     is_active = models.BooleanField(default=True)

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     # ---------- Validation ----------
#     def clean(self):
#         if self.times_per_day < 1:
#             raise ValidationError("times_per_day must be >= 1")

#         if self.custom_weekdays and self.interval_days != 1:
#             raise ValidationError(
#                 "custom_weekdays cannot be combined with interval_days"
#             )

#         if self.end_time and self.end_time <= self.start_time:
#             raise ValidationError(
#                 "end_time must be after start_time"
#             )

#     def __str__(self):
#         return f"{self.medicine.name} ({self.times_per_day}x/day)"