from django.urls import path
from DailyRemainder import views

app_name = 'DailyRemainder'

urlpatterns = [
    # Medicine endpoints
    path('medicines/', views.MedicineListCreateView.as_view(), name='medicine-list-create'),
    path('medicines/<int:pk>/', views.MedicineDetailView.as_view(), name='medicine-detail'),
    
    # Alarm endpoints
    path('alarms/', views.AlarmListCreateView.as_view(), name='alarm-list-create'),
    path('alarms/<int:pk>/', views.AlarmDetailView.as_view(), name='alarm-detail'),
    
    # Occurrence endpoints
    path('occurrences/', views.OccurrenceListView.as_view(), name='occurrence-list'),
    path('occurrences/<int:pk>/', views.OccurrenceUpdateView.as_view(), name='occurrence-update'),
    
    # Device token endpoints
    path('device-tokens/', views.DeviceTokenRegisterView.as_view(), name='device-token-register'),
    path('device-tokens/<int:pk>/', views.DeviceTokenDeleteView.as_view(), name='device-token-delete'),

    # Sync notifications (fallback when Celery Beat is not running)
    path('sync-notifications/', views.SyncNotificationsView.as_view(), name='sync-notifications'),

    # Dashboard endpoint
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]
