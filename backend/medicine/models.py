from django.db import models

from accounts.serializers import CustomUser
from pharmacy.models import Pharmacy

# Create your models here.
class MedicineRequest(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "PENDING"),
        ("ACCEPTED", "ACCEPTED"),
        ("REJECTED", "REJECTED"),
    )
     
    patient = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="medicine_requests",
    )

    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name="requests",
    )
    quantity = models.IntegerField()
    image = models.ImageField(upload_to="prescriptions/")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class PharmacyResponse(models.Model):
    request = models.OneToOneField(
        MedicineRequest,
        on_delete=models.CASCADE,
        related_name="response",
    )

    audio = models.FileField(
        upload_to="pharmacy-audio/",
        null=True,
        blank=True,
    )

    text_message = models.TextField(blank=True)
    responded_at = models.DateTimeField(auto_now_add=True)