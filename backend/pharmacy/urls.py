from pharmacy.views import PharmacyViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'register-pharmacy', PharmacyViewSet, basename='pharmacy')


urlpatterns = router.urls
