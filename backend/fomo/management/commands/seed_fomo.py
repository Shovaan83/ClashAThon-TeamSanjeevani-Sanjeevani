"""
Management command: seed_fomo

Seeds realistic MissedOpportunity data for today so the FOMO Ledger
shows live backend data instead of the frontend fallback dummy.

Usage:
    python manage.py seed_fomo              # seeds first pharmacy found
    python manage.py seed_fomo --pharmacy 2 # seeds specific pharmacy by ID
    python manage.py seed_fomo --all        # seeds every pharmacy
    python manage.py seed_fomo --clear      # clears today's data first, then seeds
"""
import random
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Sum
from django.utils import timezone

from fomo.models import MissedOpportunity
from pharmacy.models import Pharmacy


MEDICINE_POOL = [
    ("Paracetamol 500mg", 80),
    ("Amoxicillin 250mg", 320),
    ("Cetirizine 10mg", 75),
    ("Omeprazole 20mg", 150),
    ("Metformin 500mg", 210),
    ("Amlodipine 5mg", 185),
    ("Azithromycin 500mg", 450),
    ("Ibuprofen 400mg", 95),
    ("Pantoprazole 40mg", 165),
    ("Losartan 50mg", 230),
    ("Atorvastatin 10mg", 280),
    ("Ciprofloxacin 500mg", 390),
    ("Dolo 650mg", 60),
    ("Montelukast 10mg", 220),
    ("Ranitidine 150mg", 110),
    ("Vitamin D3 60K", 340),
    ("Cefixime 200mg", 420),
    ("Diclofenac 50mg", 130),
    ("Salbutamol Inhaler", 580),
]


class Command(BaseCommand):
    help = 'Seed realistic FOMO Ledger mock data for today'

    def add_arguments(self, parser):
        parser.add_argument(
            '--pharmacy', type=int, default=None,
            help='Pharmacy ID to seed data for (defaults to first pharmacy)'
        )
        parser.add_argument(
            '--all', action='store_true',
            help='Seed data for all pharmacies'
        )
        parser.add_argument(
            '--clear', action='store_true',
            help="Delete today's existing records before seeding"
        )
        parser.add_argument(
            '--count', type=int, default=18,
            help='Number of missed opportunities to create (default: 18)'
        )

    def handle(self, *args, **options):
        seed_all = options['all']
        pharmacy_id = options['pharmacy']
        clear = options['clear']
        count = options['count']

        if seed_all:
            pharmacies = list(Pharmacy.objects.all())
        elif pharmacy_id:
            try:
                pharmacies = [Pharmacy.objects.get(id=pharmacy_id)]
            except Pharmacy.DoesNotExist:
                raise CommandError(f"Pharmacy id={pharmacy_id} does not exist.")
        else:
            pharmacy = Pharmacy.objects.first()
            if not pharmacy:
                raise CommandError("No pharmacies in the database.")
            pharmacies = [pharmacy]

        today = timezone.now().date()

        for pharmacy in pharmacies:
            if clear:
                deleted, _ = MissedOpportunity.objects.filter(
                    pharmacy=pharmacy,
                    timestamp__date=today,
                ).delete()
                self.stdout.write(f"  Cleared {deleted} existing records for {pharmacy.user.email}")

            created_ids = self._seed_for_pharmacy(pharmacy, count)

            total = MissedOpportunity.objects.filter(
                pharmacy=pharmacy, timestamp__date=today
            ).aggregate(total=Sum('amount_lost'))['total'] or 0

            self.stdout.write(self.style.SUCCESS(
                f"  Seeded {len(created_ids)} misses for [{pharmacy.user.email}] "
                f"-- Rs. {float(total):,.2f} lost today"
            ))

    def _seed_for_pharmacy(self, pharmacy, count):
        now = timezone.now()

        # Spread entries across the last `count` × 20 minutes, capped at today's midnight
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        window_seconds = int((now - today_start).total_seconds())

        if window_seconds <= 0:
            window_seconds = 3600  # fallback: 1 hour

        created_ids = []
        for _ in range(count):
            # Random second offset within today's elapsed window
            offset = random.randint(0, window_seconds - 1)
            ts = today_start + timedelta(seconds=offset)

            name, base_price = random.choice(MEDICINE_POOL)
            amount = round(base_price * random.uniform(0.8, 1.2), 2)

            obj = MissedOpportunity.objects.create(
                pharmacy=pharmacy,
                item_name=name,
                amount_lost=amount,
            )
            # update() bypasses auto_now_add so we can backfill timestamps
            MissedOpportunity.objects.filter(pk=obj.pk).update(timestamp=ts)
            created_ids.append(obj.pk)

        return created_ids
