from django.db import models

from accounts.serializers import CustomUser

# Create your models here.

class Pharmacy(models.Model):
    user = models.OneToOneField(CustomUser,on_delete=models.CASCADE)
    lat = models.FloatField(default=26.6646)
    lng = models.FloatField(default=87.2718)


class PharmacyDocument(models.Model):
    Status = (
        ("PENDING","PENDING"),
        ("APPROVED","APPROVED"),
        ("REJECTED","REJECTED")
    )
    pharmacy = models.OneToOneField(Pharmacy,on_delete=models.CASCADE)
    document = models.ImageField(upload_to="pharmacy-document/")
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20,default="PENDING",choices=Status)
