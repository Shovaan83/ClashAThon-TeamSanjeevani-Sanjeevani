from django.db import models

# Create your models here.

from django.db import models
from accounts.models import CustomUser
from pharmacy.models import Pharmacy

# Create your models here.
class PingRequest(models.Model):
    customer = models.ForeignKey(CustomUser,on_delete=models.CASCADE)
    Pharmacy = models.ForeignKey(Pharmacy,on_delete=models.CASCADE)
    lat = models.FloatField()
    lng = models.FloatField()
    medicinePhoto = models.ImageField(upload_to="user/medicine")


