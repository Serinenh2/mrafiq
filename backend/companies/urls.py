from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, CompanySiteViewSet, DepartmentViewSet
router = DefaultRouter()
router.register('companies', CompanyViewSet, basename='company')
router.register('sites', CompanySiteViewSet, basename='site')
router.register('departments', DepartmentViewSet, basename='department')
urlpatterns = router.urls
