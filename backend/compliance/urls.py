from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (DomainViewSet, LegalReferenceViewSet, RequirementViewSet,
                    AssessmentViewSet, GapViewSet, ActionViewSet,
                    ComplianceRunView, ScoreView, RegistreXlsxView, ReportPdfView,
                    ValidationCheckView, DeclarationPdfView, AssistantView, DashboardView)
router = DefaultRouter()
router.register('domains', DomainViewSet, basename='domain')
router.register('legal-references', LegalReferenceViewSet, basename='legalref')
router.register('requirements', RequirementViewSet, basename='requirement')
router.register('assessments', AssessmentViewSet, basename='assessment')
router.register('gaps', GapViewSet, basename='gap')
router.register('actions', ActionViewSet, basename='action')
urlpatterns = [
    path('dashboard/', DashboardView.as_view()),
    path('companies/<int:company_id>/compliance/run/', ComplianceRunView.as_view()),
    path('companies/<int:company_id>/score/', ScoreView.as_view()),
    path('companies/<int:company_id>/export/registre.xlsx', RegistreXlsxView.as_view()),
    path('companies/<int:company_id>/export/rapport.pdf', ReportPdfView.as_view()),
    path('companies/<int:company_id>/validation-check/', ValidationCheckView.as_view()),
    path('companies/<int:company_id>/export/declaration.pdf', DeclarationPdfView.as_view()),
    path('companies/<int:company_id>/assistant/', AssistantView.as_view()),
] + router.urls
