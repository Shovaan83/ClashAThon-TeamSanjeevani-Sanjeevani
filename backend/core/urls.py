from django.contrib import admin
from django.urls import path, include  
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


schema_view = get_schema_view(
   openapi.Info(
      title="Sanjevani API",
      default_version='v1',
      description="Test description",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@yourapi.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin API must come before Django admin to prevent conflict
    path('admin/api/', include('adminapis.urls')),
    
    path('admin/', admin.site.urls),
    
    # Customer app - all customer-related endpoints
    path('customer/', include('customer.urls')),
    
    # Legacy/shared accounts endpoints (can be removed later)
    path('', include('accounts.urls')),
    
    # Pharmacy endpoints
    path('', include('pharmacy.urls')),
    path('api/profile',include('accountsprofile.urls')),
    
    # Medicine requests
    path('medicine/', include('medicine.urls')),
    
    # Daily Reminder (Medication reminders)
    path('api/daily-reminder/', include('DailyRemainder.urls')),

    # FOMO Ledger
    path('api/fomo/', include('fomo.urls')),

    # Swagger docs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
