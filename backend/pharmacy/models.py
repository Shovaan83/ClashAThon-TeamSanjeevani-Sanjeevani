from django.db import models

from accounts.models import CustomUser

# Create your models here.

class Pharmacy(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='pharmacy')
    name = models.CharField(max_length=200, blank=True, null=True)  # Pharmacy/Store name
    profile_photo = models.ImageField(upload_to="pharmacy-profile/", blank=True, null=True)  # Profile photo
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    lat = models.FloatField(default=26.6646)
    lng = models.FloatField(default=87.2718)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name or 'Pharmacy'} - {self.user.email}"


class PharmacyDocument(models.Model):
    Status = (
        ("PENDING", "PENDING"),
        ("APPROVED", "APPROVED"),
        ("REJECTED", "REJECTED")
    )
    pharmacy = models.OneToOneField(Pharmacy, on_delete=models.CASCADE, related_name='document')
    document = models.ImageField(upload_to="pharmacy-document/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, default="PENDING", choices=Status)
    created_at = models.DateTimeField(auto_now_add=True)
    message = models.CharField(max_length=200,blank=True,null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Document for {self.pharmacy.name or self.pharmacy.user.email}"
