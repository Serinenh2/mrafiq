from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, CompanySiteViewSet
router = DefaultRouter()
router.register('companies', CompanyViewSet, basename='company')
router.register('sites', CompanySiteViewSet, basename='site')
urlpatterns = router.urls
