from decimal import Decimal
import datetime

from celery import shared_task
from django.utils import timezone

from .models import MissedOpportunity


@shared_task(name='fomo.tasks.record_timed_out_requests')
def record_timed_out_requests():
    """
    Runs every 10 minutes via Celery Beat.

    Finds medicine requests that are still PENDING and older than 10 minutes,
    then creates a MissedOpportunity for every nearby pharmacy that never
    responded — meaning they saw (or should have seen) the ping and ignored it.
    """
    from medicine.models import MedicineRequest, PharmacyResponse

    cutoff = timezone.now() - datetime.timedelta(minutes=10)

    timed_out = MedicineRequest.objects.filter(
        status='PENDING',
        created_at__lte=cutoff,
    ).prefetch_related('responses')

    created_count = 0

    for request in timed_out:
        # Get pharmacies that already responded (so we don't double-count)
        responded_pharmacy_ids = set(
            request.responses.values_list('pharmacy_id', flat=True)
        )

        # Find nearby pharmacies that were notified but never responded
        nearby = request.get_nearby_pharmacies()
        for item in nearby:
            pharmacy = item['pharmacy']
            if pharmacy.id in responded_pharmacy_ids:
                continue

            # Only create if we haven't already recorded this specific timeout
            already_exists = MissedOpportunity.objects.filter(
                pharmacy=pharmacy,
                item_name=f"Request #{request.id} (timeout)",
            ).exists()

            if not already_exists:
                MissedOpportunity.objects.create(
                    pharmacy=pharmacy,
                    item_name=f"Request #{request.id} (timeout)",
                    amount_lost=Decimal('150.00'),
                )
                created_count += 1

    return f"Recorded {created_count} timed-out missed opportunities"
