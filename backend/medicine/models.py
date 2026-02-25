from django.db import models
from accounts.serializers import CustomUser
from pharmacy.models import Pharmacy
import math

# Create your models here.
class MedicineRequest(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "PENDING"),
        ("ACCEPTED", "ACCEPTED"),
        ("REJECTED", "REJECTED"),
        ("CANCELLED", "CANCELLED"),
    )
     
    patient = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="medicine_requests",
    )

    # Pharmacy assigned after acceptance (null until then)
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name="requests",
        null=True,
        blank=True
    )
    
    # Patient location for finding nearby pharmacies
    patient_lat = models.FloatField(default=0.0)
    patient_lng = models.FloatField(default=0.0)
    
    # Search radius in kilometers
    radius_km = models.FloatField(default=5.0)
    
    quantity = models.IntegerField()
    image = models.ImageField(upload_to="prescriptions/")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_nearby_pharmacies(self):
        """Get all pharmacies within the radius"""
        all_pharmacies = Pharmacy.objects.all()
        nearby = []
        
        for pharmacy in all_pharmacies:
            distance = self.calculate_distance(
                self.patient_lat, self.patient_lng,
                pharmacy.lat, pharmacy.lng
            )
            if distance <= self.radius_km:
                nearby.append({'pharmacy': pharmacy, 'distance': distance})
        
        # Sort by distance
        nearby.sort(key=lambda x: x['distance'])
        return nearby
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371  # Earth radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

class PharmacyResponse(models.Model):
    """Track responses from pharmacies (accept/reject/substitute with optional audio)"""
    RESPONSE_CHOICES = (
        ("ACCEPTED", "ACCEPTED"),
        ("REJECTED", "REJECTED"),
        ("SUBSTITUTE", "SUBSTITUTE"),
    )
    
    request = models.ForeignKey(
        MedicineRequest,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    
    response_type = models.CharField(
        max_length=20,
        choices=RESPONSE_CHOICES
    )

    audio = models.FileField(
        upload_to="pharmacy-audio/",
        null=True,
        blank=True,
    )

    text_message = models.TextField(blank=True)

    # Vikalpa (substitute) fields — only populated when response_type == SUBSTITUTE
    substitute_name = models.CharField(max_length=255, blank=True, default='')
    substitute_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    responded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['request', 'pharmacy']  # One response per pharmacy per request