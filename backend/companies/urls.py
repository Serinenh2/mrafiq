from rest_framework.routers import DefaultRouter
from .views import (CompanyViewSet, CompanySiteViewSet, DepartmentViewSet,
                    SecurityChecklistViewSet, RightsProcedureViewSet, AnpdpDossierViewSet,
                    WilayaViewSet, CommuneViewSet)
router = DefaultRouter()
router.register('companies', CompanyViewSet, basename='company')
router.register('sites', CompanySiteViewSet, basename='site')
router.register('departments', DepartmentViewSet, basename='department')
router.register('security-checklist', SecurityChecklistViewSet, basename='security-checklist')
router.register('rights-procedures', RightsProcedureViewSet, basename='rights-procedure')
router.register('anpdp-dossier', AnpdpDossierViewSet, basename='anpdp-dossier')
router.register('wilayas', WilayaViewSet, basename='wilaya')
router.register('communes', CommuneViewSet, basename='commune')
urlpatterns = router.urls
