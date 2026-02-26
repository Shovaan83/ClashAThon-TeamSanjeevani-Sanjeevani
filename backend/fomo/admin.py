from django.contrib import admin
from .models import MissedOpportunity


@admin.register(MissedOpportunity)
class MissedOpportunityAdmin(admin.ModelAdmin):
    list_display = ('pharmacy', 'item_name', 'amount_lost', 'timestamp')
    list_filter = ('pharmacy', 'timestamp')
    search_fields = ('item_name', 'pharmacy__name')
    ordering = ('-timestamp',)
