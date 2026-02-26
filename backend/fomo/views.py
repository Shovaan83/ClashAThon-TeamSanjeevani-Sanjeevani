import pytz
import datetime

from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DurationField
from django.db.models.functions import ExtractHour, TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import MissedOpportunity


HOUR_LABELS = {
    0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM',
    6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
    12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
    18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
}

# Use server's configured timezone for display; fall back to UTC
try:
    _LOCAL_TZ = pytz.timezone(settings.TIME_ZONE)
except Exception:
    _LOCAL_TZ = pytz.utc


def _local_strftime(dt, fmt):
    """Format a UTC-stored datetime in local time, safely on all platforms."""
    local_dt = timezone.localtime(dt, _LOCAL_TZ)
    hour = local_dt.hour
    minute = local_dt.minute
    period = 'AM' if hour < 12 else 'PM'
    display_hour = hour % 12 or 12
    return f"{display_hour}:{minute:02d} {period}"


class FomoLedgerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pharmacy = request.user.pharmacy
        except Exception:
            return Response({
                'total_lost_today': 0.0,
                'hourly_data': [],
                'recent_misses': [],
            })

        today = timezone.now().date()
        qs = MissedOpportunity.objects.filter(
            pharmacy=pharmacy,
            timestamp__date=today,
        )

        # Total lost today
        total = qs.aggregate(total=Sum('amount_lost'))['total'] or 0

        # Hourly aggregation in local timezone
        hourly_qs = (
            qs
            .annotate(hour=ExtractHour('timestamp', tzinfo=_LOCAL_TZ))
            .values('hour')
            .annotate(lost=Sum('amount_lost'))
            .order_by('hour')
        )
        hourly_data = [
            {'time': HOUR_LABELS.get(row['hour'], f"{row['hour']}h"), 'lost': float(row['lost'])}
            for row in hourly_qs
        ]

        # Last 3 misses in local time
        recent = qs.order_by('-timestamp')[:3]
        recent_misses = [
            {
                'item_name': miss.item_name,
                'amount': float(miss.amount_lost),
                'time': _local_strftime(miss.timestamp, ''),
            }
            for miss in recent
        ]

        return Response({
            'total_lost_today': float(total),
            'hourly_data': hourly_data,
            'recent_misses': recent_misses,
        })


class AnalyticsSummaryView(APIView):
    """
    GET /api/fomo/analytics/
    Returns response rate, avg response time, and response breakdown
    for the authenticated pharmacy.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pharmacy = request.user.pharmacy
        except Exception:
            return Response({
                'response_rate': {'total_requests': 0, 'responded': 0, 'rate': 0.0},
                'avg_response_time': {'avg_minutes': 0.0, 'benchmark': 'good'},
                'response_breakdown': {'accepted': 0, 'rejected': 0, 'substituted': 0},
            })

        from medicine.models import MedicineRequest, PharmacyResponse

        total_requests = MedicineRequest.objects.filter(
            responses__pharmacy=pharmacy
        ).distinct().count()

        responded = PharmacyResponse.objects.filter(pharmacy=pharmacy).count()
        accepted = PharmacyResponse.objects.filter(pharmacy=pharmacy, response_type='ACCEPTED').count()
        rejected = PharmacyResponse.objects.filter(pharmacy=pharmacy, response_type='REJECTED').count()
        substituted = PharmacyResponse.objects.filter(pharmacy=pharmacy, response_type='SUBSTITUTE').count()

        rate = round((responded / total_requests * 100), 1) if total_requests > 0 else 0.0

        # Avg response time: mean seconds between request creation and pharmacy response
        avg_seconds = None
        responses_with_times = PharmacyResponse.objects.filter(
            pharmacy=pharmacy
        ).select_related('request')
        deltas = []
        for resp in responses_with_times:
            delta = (resp.responded_at - resp.request.created_at).total_seconds()
            if delta >= 0:
                deltas.append(delta)
        if deltas:
            avg_seconds = sum(deltas) / len(deltas)

        avg_minutes = round(avg_seconds / 60, 1) if avg_seconds is not None else 0.0
        if avg_minutes < 5:
            benchmark = 'good'
        elif avg_minutes < 10:
            benchmark = 'fair'
        else:
            benchmark = 'slow'

        return Response({
            'response_rate': {
                'total_requests': total_requests,
                'responded': responded,
                'rate': rate,
            },
            'avg_response_time': {
                'avg_minutes': avg_minutes,
                'benchmark': benchmark,
            },
            'response_breakdown': {
                'accepted': accepted,
                'rejected': rejected,
                'substituted': substituted,
            },
        })


class WeeklyFomoTrendView(APIView):
    """
    GET /api/fomo/weekly/
    Returns last 7 days of missed opportunity sums grouped by day label.
    """
    permission_classes = [IsAuthenticated]

    DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    def get(self, request):
        try:
            pharmacy = request.user.pharmacy
        except Exception:
            return Response([])

        today = timezone.now().date()
        seven_days_ago = today - datetime.timedelta(days=6)

        qs = (
            MissedOpportunity.objects
            .filter(pharmacy=pharmacy, timestamp__date__gte=seven_days_ago)
            .annotate(day=TruncDate('timestamp'))
            .values('day')
            .annotate(lost=Sum('amount_lost'))
            .order_by('day')
        )

        # Build a full 7-day map (fill missing days with 0)
        day_map: dict = {}
        for i in range(7):
            d = seven_days_ago + datetime.timedelta(days=i)
            day_map[d] = 0.0

        for row in qs:
            if row['day'] in day_map:
                day_map[row['day']] = float(row['lost'])

        result = [
            {'day': self.DAY_ABBR[d.weekday() + 1 if d.weekday() < 6 else 0], 'lost': lost}
            for d, lost in day_map.items()
        ]
        return Response(result)


class TopMissedMedicinesView(APIView):
    """
    GET /api/fomo/top-missed/
    Returns top 5 most-missed medicine names for the authenticated pharmacy.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pharmacy = request.user.pharmacy
        except Exception:
            return Response([])

        qs = (
            MissedOpportunity.objects
            .filter(pharmacy=pharmacy)
            .values('item_name')
            .annotate(count=Count('id'), total_lost=Sum('amount_lost'))
            .order_by('-count')[:5]
        )

        result = [
            {
                'name': row['item_name'],
                'count': row['count'],
                'total_lost': float(row['total_lost']),
            }
            for row in qs
        ]
        return Response(result)
