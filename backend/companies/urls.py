from rest_framework.routers import DefaultRouter
from .views import (CompanyViewSet, CompanySiteViewSet, DepartmentViewSet,
                    SecurityChecklistViewSet, RightsProcedureViewSet)
router = DefaultRouter()
router.register('companies', CompanyViewSet, basename='company')
router.register('sites', CompanySiteViewSet, basename='site')
router.register('departments', DepartmentViewSet, basename='department')
router.register('security-checklist', SecurityChecklistViewSet, basename='security-checklist')
router.register('rights-procedures', RightsProcedureViewSet, basename='rights-procedure')
urlpatterns = router.urls
