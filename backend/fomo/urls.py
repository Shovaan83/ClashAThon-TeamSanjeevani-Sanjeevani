from django.urls import path
from .views import FomoLedgerView, AnalyticsSummaryView, WeeklyFomoTrendView, TopMissedMedicinesView

urlpatterns = [
    path('', FomoLedgerView.as_view(), name='fomo-ledger'),
    path('analytics/', AnalyticsSummaryView.as_view(), name='fomo-analytics'),
    path('weekly/', WeeklyFomoTrendView.as_view(), name='fomo-weekly'),
    path('top-missed/', TopMissedMedicinesView.as_view(), name='fomo-top-missed'),
]
