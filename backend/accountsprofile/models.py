from django.db import models
from pharmacy.models import PharmacyDocument
from pharmacy.models import Pharmacy

# Create your models here.
class PharmacyProfile(models.Model):
    pharmacy_docs = models.ForeignKey(PharmacyDocument,on_delete=models.CASCADE)
    pharmacy = models.ForeignKey(Pharmacy,on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

