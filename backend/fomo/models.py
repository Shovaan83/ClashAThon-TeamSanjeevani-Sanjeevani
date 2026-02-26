from django.db import models
from pharmacy.models import Pharmacy


class MissedOpportunity(models.Model):
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='missed_opportunities',
    )
    item_name = models.CharField(max_length=200)
    amount_lost = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Missed Opportunities'

    def __str__(self):
        return f"{self.pharmacy} — {self.item_name} (Rs.{self.amount_lost})"
