from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta, date

from utils.response import ResponseMixin
from DailyRemainder.models import Medicine, Alarm, AlarmOccurrence, DeviceToken
from DailyRemainder.serializers import (
    MedicineSerializer, AlarmSerializer, AlarmDetailSerializer,
    AlarmOccurrenceSerializer, DeviceTokenSerializer, DashboardSerializer
)


# -------------------------
# Medicine Views
# -------------------------
class MedicineListCreateView(ResponseMixin, APIView):
    """List all medicines or create a new medicine for the authenticated user."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all medicines for the authenticated user."""
        medicines = Medicine.objects.filter(user=request.user).order_by('-created_at')
        serializer = MedicineSerializer(medicines, many=True)
        return self.success_response(
            data=serializer.data,
            message="Medicines retrieved successfully"
        )
    
    def post(self, request):
        """Create a new medicine."""
        serializer = MedicineSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return self.success_response(
                data=serializer.data,
                message="Medicine created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return self.validation_error_response(errors=serializer.errors)


class MedicineDetailView(ResponseMixin, APIView):
    """Retrieve, update or delete a medicine."""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk, user):
        """Get medicine object if it belongs to the user."""
        try:
            return Medicine.objects.get(pk=pk, user=user)
        except Medicine.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Get medicine details."""
        medicine = self.get_object(pk, request.user)
        if not medicine:
            return self.not_found_response("Medicine not found")
        
        serializer = MedicineSerializer(medicine)
        return self.success_response(data=serializer.data)
    
    def put(self, request, pk):
        """Update medicine."""
        medicine = self.get_object(pk, request.user)
        if not medicine:
            return self.not_found_response("Medicine not found")
        
        serializer = MedicineSerializer(medicine, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.success_response(
                data=serializer.data,
                message="Medicine updated successfully"
            )
        return self.validation_error_response(errors=serializer.errors)
    
    def delete(self, request, pk):
        """Delete medicine and all associated alarms."""
        medicine = self.get_object(pk, request.user)
        if not medicine:
            return self.not_found_response("Medicine not found")
        
        medicine.delete()
        return self.success_response(message="Medicine deleted successfully")


# -------------------------
# Alarm Views
# -------------------------
class AlarmListCreateView(ResponseMixin, APIView):
    """List all alarms or create a new alarm."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all alarms for the authenticated user's medicines."""
        medicines = Medicine.objects.filter(user=request.user)
        alarms = Alarm.objects.filter(medicine__in=medicines).select_related('medicine').order_by('-created_at')
        
        # Filter by active status if requested
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            alarms = alarms.filter(is_active=is_active.lower() == 'true')
        
        serializer = AlarmSerializer(alarms, many=True)
        return self.success_response(
            data=serializer.data,
            message="Alarms retrieved successfully"
        )
    
    def post(self, request):
        """Create a new alarm."""
        serializer = AlarmSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return self.success_response(
                data=serializer.data,
                message="Alarm created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return self.validation_error_response(errors=serializer.errors)


class AlarmDetailView(ResponseMixin, APIView):
    """Retrieve, update or deactivate an alarm."""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk, user):
        """Get alarm object if it belongs to the user's medicine."""
        try:
            return Alarm.objects.select_related('medicine').get(
                pk=pk,
                medicine__user=user
            )
        except Alarm.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Get alarm details with statistics."""
        alarm = self.get_object(pk, request.user)
        if not alarm:
            return self.not_found_response("Alarm not found")
        
        serializer = AlarmDetailSerializer(alarm)
        return self.success_response(data=serializer.data)
    
    def put(self, request, pk):
        """Update alarm."""
        alarm = self.get_object(pk, request.user)
        if not alarm:
            return self.not_found_response("Alarm not found")
        
        serializer = AlarmSerializer(alarm, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return self.success_response(
                data=serializer.data,
                message="Alarm updated successfully"
            )
        return self.validation_error_response(errors=serializer.errors)
    
    def delete(self, request, pk):
        """Deactivate alarm (soft delete)."""
        alarm = self.get_object(pk, request.user)
        if not alarm:
            return self.not_found_response("Alarm not found")
        
        alarm.is_active = False
        alarm.save()
        return self.success_response(message="Alarm deactivated successfully")


# -------------------------
# Occurrence Views
# -------------------------
class OccurrenceListView(ResponseMixin, APIView):
    """List alarm occurrences with filtering options."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get occurrences for the authenticated user."""
        medicines = Medicine.objects.filter(user=request.user)
        occurrences = AlarmOccurrence.objects.filter(
            alarm__medicine__in=medicines
        ).select_related('alarm__medicine').order_by('scheduled_at')
        
        # Filter by date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from_dt = datetime.strptime(date_from, '%Y-%m-%d').date()
                occurrences = occurrences.filter(scheduled_at__date__gte=date_from_dt)
            except ValueError:
                return self.validation_error_response(
                    errors="Invalid date_from format. Use YYYY-MM-DD"
                )
        
        if date_to:
            try:
                date_to_dt = datetime.strptime(date_to, '%Y-%m-%d').date()
                occurrences = occurrences.filter(scheduled_at__date__lte=date_to_dt)
            except ValueError:
                return self.validation_error_response(
                    errors="Invalid date_to format. Use YYYY-MM-DD"
                )
        
        # Filter by status
        status_param = request.query_params.get('status')
        if status_param:
            occurrences = occurrences.filter(status=status_param)
        
        # Default to today if no filters
        if not date_from and not date_to:
            occurrences = occurrences.filter(scheduled_at__date=date.today())
        
        serializer = AlarmOccurrenceSerializer(occurrences, many=True)
        return self.success_response(
            data=serializer.data,
            message="Occurrences retrieved successfully"
        )


class OccurrenceUpdateView(ResponseMixin, APIView):
    """Update an occurrence status."""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk, user):
        """Get occurrence if it belongs to user's medicine."""
        try:
            return AlarmOccurrence.objects.select_related('alarm__medicine').get(
                pk=pk,
                alarm__medicine__user=user
            )
        except AlarmOccurrence.DoesNotExist:
            return None
    
    def patch(self, request, pk):
        """Update occurrence status."""
        occurrence = self.get_object(pk, request.user)
        if not occurrence:
            return self.not_found_response("Occurrence not found")
        
        serializer = AlarmOccurrenceSerializer(
            occurrence,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return self.success_response(
                data=serializer.data,
                message="Occurrence updated successfully"
            )
        return self.validation_error_response(errors=serializer.errors)


# -------------------------
# Device Token Views
# -------------------------
class DeviceTokenRegisterView(ResponseMixin, APIView):
    """Register a device token for push notifications."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Register or update device token."""
        serializer = DeviceTokenSerializer(data=request.data)
        if serializer.is_valid():
            # Update or create token
            token_obj, created = DeviceToken.objects.update_or_create(
                user=request.user,
                platform=serializer.validated_data['platform'],
                token=serializer.validated_data['token'],
                defaults={'is_active': True}
            )
            
            message = "Device token registered successfully" if created else "Device token updated successfully"
            return self.success_response(
                data=DeviceTokenSerializer(token_obj).data,
                message=message,
                status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        return self.validation_error_response(errors=serializer.errors)


class DeviceTokenDeleteView(ResponseMixin, APIView):
    """Deactivate a device token."""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        """Deactivate device token."""
        try:
            token = DeviceToken.objects.get(pk=pk, user=request.user)
            token.is_active = False
            token.save()
            return self.success_response(message="Device token deactivated successfully")
        except DeviceToken.DoesNotExist:
            return self.not_found_response("Device token not found")


# -------------------------
# Dashboard View
# -------------------------
class DashboardView(ResponseMixin, APIView):
    """Get user's medication adherence dashboard."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Calculate and return dashboard statistics."""
        user = request.user
        medicines = Medicine.objects.filter(user=user)
        
        # Total medicines
        total_medicines = medicines.count()
        
        # Active alarms
        active_alarms = Alarm.objects.filter(
            medicine__in=medicines,
            is_active=True
        ).count()
        
        # Today's occurrences
        today = date.today()
        today_occurrences = AlarmOccurrence.objects.filter(
            alarm__medicine__in=medicines,
            scheduled_at__date=today
        )
        
        today_scheduled = today_occurrences.count()
        today_taken = today_occurrences.filter(status=AlarmOccurrence.STATUS_TAKEN).count()
        today_missed = today_occurrences.filter(status=AlarmOccurrence.STATUS_MISSED).count()
        today_pending = today_occurrences.filter(status=AlarmOccurrence.STATUS_SCHEDULED).count()
        
        # All-time stats
        all_occurrences = AlarmOccurrence.objects.filter(alarm__medicine__in=medicines)
        total_taken_all_time = all_occurrences.filter(status=AlarmOccurrence.STATUS_TAKEN).count()
        total_missed_all_time = all_occurrences.filter(status=AlarmOccurrence.STATUS_MISSED).count()
        
        # Adherence rate (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        recent_occurrences = AlarmOccurrence.objects.filter(
            alarm__medicine__in=medicines,
            scheduled_at__date__gte=thirty_days_ago,
            scheduled_at__date__lte=today
        ).exclude(status=AlarmOccurrence.STATUS_SCHEDULED)
        
        recent_total = recent_occurrences.count()
        recent_taken = recent_occurrences.filter(status=AlarmOccurrence.STATUS_TAKEN).count()
        adherence_rate = (recent_taken / recent_total * 100) if recent_total > 0 else 0
        
        # Current streak (consecutive days with all doses taken)
        current_streak = self.calculate_streak(medicines)
        
        # Upcoming occurrences (next 24 hours, with pending status)
        now = timezone.now()
        upcoming = AlarmOccurrence.objects.filter(
            alarm__medicine__in=medicines,
            scheduled_at__gte=now,
            scheduled_at__lte=now + timedelta(hours=24),
            status=AlarmOccurrence.STATUS_SCHEDULED
        ).select_related('alarm__medicine').order_by('scheduled_at')[:5]
        
        data = {
            'total_medicines': total_medicines,
            'active_alarms': active_alarms,
            'today_scheduled': today_scheduled,
            'today_taken': today_taken,
            'today_missed': today_missed,
            'today_pending': today_pending,
            'adherence_rate': round(adherence_rate, 2),
            'current_streak': current_streak,
            'total_taken_all_time': total_taken_all_time,
            'total_missed_all_time': total_missed_all_time,
            'upcoming_occurrences': AlarmOccurrenceSerializer(upcoming, many=True).data
        }
        
        serializer = DashboardSerializer(data=data)
        if serializer.is_valid():
            return self.success_response(
                data=serializer.data,
                message="Dashboard data retrieved successfully"
            )
        return self.error_response(errors=serializer.errors)
    
    def calculate_streak(self, medicines):
        """Calculate current streak of consecutive days with 100% adherence."""
        streak = 0
        check_date = date.today() - timedelta(days=1)  # Start from yesterday
        
        for _ in range(365):  # Max check 1 year
            day_occurrences = AlarmOccurrence.objects.filter(
                alarm__medicine__in=medicines,
                scheduled_at__date=check_date
            ).exclude(status=AlarmOccurrence.STATUS_SCHEDULED)
            
            if day_occurrences.count() == 0:
                # No scheduled occurrences for this day
                check_date -= timedelta(days=1)
                continue
            
            # Check if all were taken
            taken = day_occurrences.filter(status=AlarmOccurrence.STATUS_TAKEN).count()
            total = day_occurrences.count()
            
            if taken == total:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        
        return streak
