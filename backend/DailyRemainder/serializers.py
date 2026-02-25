from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from DailyRemainder.models import Medicine, Alarm, AlarmOccurrence, DeviceToken


class MedicineSerializer(serializers.ModelSerializer):
    """Serializer for Medicine model."""
    
    class Meta:
        model = Medicine
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlarmSerializer(serializers.ModelSerializer):
    """Serializer for Alarm model."""
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    
    class Meta:
        model = Alarm
        fields = [
            'id', 'medicine', 'medicine_name', 'start_date', 'end_date',
            'start_time', 'end_time', 'times_per_day', 'interval_days',
            'custom_weekdays', 'timezone', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Run model-level validation using the model's clean() method.
        """
        # Create a temporary instance for validation
        instance = Alarm(**data)
        
        # If updating, use existing instance
        if self.instance:
            for key, value in data.items():
                setattr(instance, key, value)
            instance = self.instance
        
        # Run model validation
        try:
            instance.clean()
        except Exception as e:
            raise serializers.ValidationError(str(e))
        
        return data
    
    def validate_medicine(self, value):
        """Ensure medicine belongs to the requesting user."""
        request = self.context.get('request')
        if request and value.user != request.user:
            raise serializers.ValidationError(
                "You can only create alarms for your own medicines."
            )
        return value


class AlarmDetailSerializer(AlarmSerializer):
    """Extended serializer with occurrence count."""
    total_occurrences = serializers.SerializerMethodField()
    taken_count = serializers.SerializerMethodField()
    missed_count = serializers.SerializerMethodField()
    
    class Meta(AlarmSerializer.Meta):
        fields = AlarmSerializer.Meta.fields + [
            'total_occurrences', 'taken_count', 'missed_count'
        ]
    
    def get_total_occurrences(self, obj):
        return obj.occurrences.count()
    
    def get_taken_count(self, obj):
        return obj.occurrences.filter(status=AlarmOccurrence.STATUS_TAKEN).count()
    
    def get_missed_count(self, obj):
        return obj.occurrences.filter(status=AlarmOccurrence.STATUS_MISSED).count()


class AlarmOccurrenceSerializer(serializers.ModelSerializer):
    """Serializer for AlarmOccurrence model."""
    medicine_name = serializers.CharField(source='alarm.medicine.name', read_only=True)
    alarm_id = serializers.IntegerField(source='alarm.id', read_only=True)
    
    class Meta:
        model = AlarmOccurrence
        fields = [
            'id', 'alarm_id', 'medicine_name', 'scheduled_at',
            'taken_at', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'scheduled_at', 'created_at']
    
    def validate_status(self, value):
        """Validate status transitions."""
        if self.instance:
            old_status = self.instance.status
            
            # Don't allow changing from taken/skipped back to scheduled
            if old_status in [AlarmOccurrence.STATUS_TAKEN, AlarmOccurrence.STATUS_SKIPPED]:
                if value == AlarmOccurrence.STATUS_SCHEDULED:
                    raise serializers.ValidationError(
                        "Cannot change status back to scheduled."
                    )
        
        return value
    
    def update(self, instance, validated_data):
        """Update occurrence and set taken_at if marked as taken."""
        if validated_data.get('status') == AlarmOccurrence.STATUS_TAKEN:
            validated_data['taken_at'] = timezone.now()
        
        return super().update(instance, validated_data)


class DeviceTokenSerializer(serializers.ModelSerializer):
    """Serializer for DeviceToken model."""
    
    class Meta:
        model = DeviceToken
        fields = ['id', 'token', 'platform', 'is_active', 'updated_at']
        read_only_fields = ['id', 'updated_at']
    
    def validate_platform(self, value):
        """Validate platform is android or ios."""
        if value not in ['android', 'ios']:
            raise serializers.ValidationError(
                "Platform must be 'android' or 'ios'."
            )
        return value


class DashboardSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    total_medicines = serializers.IntegerField()
    active_alarms = serializers.IntegerField()
    today_scheduled = serializers.IntegerField()
    today_taken = serializers.IntegerField()
    today_missed = serializers.IntegerField()
    today_pending = serializers.IntegerField()
    adherence_rate = serializers.FloatField()
    current_streak = serializers.IntegerField()
    total_taken_all_time = serializers.IntegerField()
    total_missed_all_time = serializers.IntegerField()
    upcoming_occurrences = AlarmOccurrenceSerializer(many=True, read_only=True)
