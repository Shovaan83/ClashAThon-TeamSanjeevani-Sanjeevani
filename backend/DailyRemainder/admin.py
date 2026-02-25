from django.contrib import admin
from django.utils.html import format_html
from DailyRemainder.models import Medicine, Alarm, AlarmOccurrence, DeviceToken


class AlarmInline(admin.TabularInline):
    """Inline for displaying alarms when viewing a Medicine."""
    model = Alarm
    extra = 0
    fields = ['start_date', 'end_date', 'start_time', 'times_per_day', 'is_active']
    readonly_fields = []


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    """Admin interface for Medicine model."""
    list_display = ['id', 'name', 'user', 'alarm_count', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['name', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [AlarmInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def alarm_count(self, obj):
        """Display count of alarms for this medicine."""
        count = obj.alarms.count()
        return format_html(
            '<a href="/admin/DailyRemainder/alarm/?medicine__id__exact={}">{} alarms</a>',
            obj.id, count
        )
    alarm_count.short_description = 'Alarms'


@admin.register(Alarm)
class AlarmAdmin(admin.ModelAdmin):
    """Admin interface for Alarm model."""
    list_display = [
        'id', 'medicine_name', 'user_name', 'times_per_day',
        'start_date', 'end_date', 'is_active', 'occurrence_count'
    ]
    list_filter = ['is_active', 'start_date', 'times_per_day', 'timezone']
    search_fields = [
        'medicine__name', 'medicine__user__email',
        'medicine__user__first_name', 'medicine__user__last_name'
    ]
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Medicine Information', {
            'fields': ('medicine',)
        }),
        ('Date Configuration', {
            'fields': ('start_date', 'end_date')
        }),
        ('Time Configuration', {
            'fields': ('start_time', 'end_time', 'times_per_day')
        }),
        ('Scheduling', {
            'fields': ('interval_days', 'custom_weekdays', 'timezone')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def medicine_name(self, obj):
        """Display medicine name."""
        return obj.medicine.name
    medicine_name.short_description = 'Medicine'
    medicine_name.admin_order_field = 'medicine__name'
    
    def user_name(self, obj):
        """Display user name or email."""
        user = obj.medicine.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.email
    user_name.short_description = 'User'
    user_name.admin_order_field = 'medicine__user__email'
    
    def occurrence_count(self, obj):
        """Display count of occurrences for this alarm."""
        count = obj.occurrences.count()
        return format_html(
            '<a href="/admin/DailyRemainder/alarmoccurrence/?alarm__id__exact={}">{} occurrences</a>',
            obj.id, count
        )
    occurrence_count.short_description = 'Occurrences'


@admin.register(AlarmOccurrence)
class AlarmOccurrenceAdmin(admin.ModelAdmin):
    """Admin interface for AlarmOccurrence model."""
    list_display = [
        'id', 'medicine_name', 'user_name', 'scheduled_at',
        'status_badge', 'taken_at'
    ]
    list_filter = ['status', 'scheduled_at', 'alarm__medicine__user']
    search_fields = [
        'alarm__medicine__name',
        'alarm__medicine__user__email',
        'alarm__medicine__user__first_name',
        'alarm__medicine__user__last_name'
    ]
    readonly_fields = ['created_at']
    date_hierarchy = 'scheduled_at'
    
    fieldsets = (
        ('Alarm Information', {
            'fields': ('alarm',)
        }),
        ('Schedule', {
            'fields': ('scheduled_at', 'status', 'taken_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def medicine_name(self, obj):
        """Display medicine name."""
        return obj.alarm.medicine.name
    medicine_name.short_description = 'Medicine'
    medicine_name.admin_order_field = 'alarm__medicine__name'
    
    def user_name(self, obj):
        """Display user name or email."""
        user = obj.alarm.medicine.user
        name = f"{user.first_name} {user.last_name}".strip()
        return name if name else user.email
    user_name.short_description = 'User'
    user_name.admin_order_field = 'alarm__medicine__user__email'
    
    def status_badge(self, obj):
        """Display colored status badge."""
        colors = {
            'scheduled': '#ffc107',  # Yellow
            'taken': '#28a745',      # Green
            'missed': '#dc3545',     # Red
            'skipped': '#6c757d',    # Gray
        }
        color = colors.get(obj.status, '#000')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    actions = ['mark_as_taken', 'mark_as_missed', 'mark_as_skipped']
    
    def mark_as_taken(self, request, queryset):
        """Bulk action to mark occurrences as taken."""
        from django.utils import timezone
        updated = queryset.update(
            status=AlarmOccurrence.STATUS_TAKEN,
            taken_at=timezone.now()
        )
        self.message_user(request, f'{updated} occurrences marked as taken.')
    mark_as_taken.short_description = 'Mark selected as Taken'
    
    def mark_as_missed(self, request, queryset):
        """Bulk action to mark occurrences as missed."""
        updated = queryset.update(status=AlarmOccurrence.STATUS_MISSED)
        self.message_user(request, f'{updated} occurrences marked as missed.')
    mark_as_missed.short_description = 'Mark selected as Missed'
    
    def mark_as_skipped(self, request, queryset):
        """Bulk action to mark occurrences as skipped."""
        updated = queryset.update(status=AlarmOccurrence.STATUS_SKIPPED)
        self.message_user(request, f'{updated} occurrences marked as skipped.')
    mark_as_skipped.short_description = 'Mark selected as Skipped'


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    """Admin interface for DeviceToken model."""
    list_display = ['id', 'user', 'platform', 'token_preview', 'is_active', 'updated_at']
    list_filter = ['platform', 'is_active', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'token']
    readonly_fields = ['updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Token Information', {
            'fields': ('token', 'platform', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    
    def token_preview(self, obj):
        """Display shortened token for readability."""
        if len(obj.token) > 20:
            return f"{obj.token[:10]}...{obj.token[-10:]}"
        return obj.token
    token_preview.short_description = 'Token'
    
    actions = ['activate_tokens', 'deactivate_tokens']
    
    def activate_tokens(self, request, queryset):
        """Bulk action to activate tokens."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} tokens activated.')
    activate_tokens.short_description = 'Activate selected tokens'
    
    def deactivate_tokens(self, request, queryset):
        """Bulk action to deactivate tokens."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} tokens deactivated.')
    deactivate_tokens.short_description = 'Deactivate selected tokens'
