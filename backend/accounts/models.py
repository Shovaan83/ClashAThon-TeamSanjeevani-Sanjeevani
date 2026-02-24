from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    class Types(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        PHARMACY = "PHARMACY", "Pharmacy"
        CUSTOMER = "CUSTOMER", "Customer"

    email = models.EmailField(max_length=200,unique=True,blank=False,null=False)
    name = models.CharField(max_length=200,null=False,blank=False)
    phone_number = models.CharField(max_length=10,blank=False,null=False)
    role = models.CharField(
        max_length=80, choices=Types.choices, default=Types.CUSTOMER
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []





class Pharmacy(models.Model):
    user = models.OneToOneField(CustomUser,on_delete=models.CASCADE)
    lat = models.FloatField()
    lng = models.FloatField()



class PharmacyDocument(models.Model):
    pharmacy = models.OneToOneField(Pharmacy,on_delete=models.CASCADE)
    document = models.ImageField(upload_to="pharmacy-document/")
    is_active = models.BooleanField(default=True)






class Otp(models.Model):
    otp = models.CharField(max_length=6)
    email = models.EmailField(max_length=200,unique=True,blank=False,null=False)
    is_verified = models.BooleanField(default=False)
    
    