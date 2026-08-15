from django.db.models import Count, Q, Avg
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet, log
from companies.models import Company
from processing.models import ProcessingActivity
from .models import Domain, LegalReference, Requirement, Assessment, Gap, Action
from .serializers import (DomainSerializer, LegalReferenceSerializer, RequirementSerializer,
                          AssessmentSerializer, GapSerializer, ActionSerializer)
from .services import run_engine, company_score, validation_report
from . import exports

class DomainViewSet(AuditModelViewSet):
    queryset = Domain.objects.all(); serializer_class = DomainSerializer
    permission_classes = [IsConsultantOrAdmin]; pagination_class = None

class LegalReferenceViewSet(AuditModelViewSet):
    queryset = LegalReference.objects.all(); serializer_class = LegalReferenceSerializer
    permission_classes = [IsConsultantOrAdmin]; pagination_class = None

class RequirementViewSet(AuditModelViewSet):
    queryset = Requirement.objects.select_related('domain','legal_reference')
    serializer_class = RequirementSerializer
    permission_classes = [IsConsultantOrAdmin]; pagination_class = None

class AssessmentViewSet(AuditModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [IsConsultantOrAdmin]; pagination_class = None
    def get_queryset(self):
        qs = scope_to_company(
            Assessment.objects.select_related('requirement__domain','processing'),
            self.request.user, field='processing__company')
        proc = self.request.query_params.get('processing')
        return qs.filter(processing_id=proc) if proc else qs
    def perform_update(self, serializer):
        old = None
        instance = serializer.save(updated_by=self.request.user)
        log(self.request.user, 'update', instance, request=self.request)

class GapViewSet(AuditModelViewSet):
    serializer_class = GapSerializer
    permission_classes = [IsConsultantOrAdmin]; pagination_class = None
    def get_queryset(self):
        qs = scope_to_company(Gap.objects.select_related('processing','requirement'), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs

class ActionViewSet(AuditModelViewSet):
    serializer_class = ActionSerializer; pagination_class = None
    def get_queryset(self):
        qs = scope_to_company(Action.objects.select_related('processing'), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs
    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status in ('termine', 'valide') and not instance.closed_at:
            instance.closed_at = timezone.now(); instance.save(update_fields=['closed_at'])
        log(self.request.user, 'update', instance, request=self.request)

class ComplianceRunView(APIView):
    permission_classes = [IsConsultantOrAdmin]
    def post(self, request, company_id):
        company = Company.objects.get(pk=company_id)
        return Response(run_engine(company, request.user))

class ScoreView(APIView):
    def get(self, request, company_id):
        company = Company.objects.get(pk=company_id)
        if request.user.role == 'company' and request.user.company_id != company.pk:
            return Response(status=403)
        return Response(company_score(company))

class RegistreXlsxView(APIView):
    permission_classes = [IsConsultantOrAdmin]
    def get(self, request, company_id):
        return exports.registre_xlsx(Company.objects.get(pk=company_id))

class ReportPdfView(APIView):
    permission_classes = [IsConsultantOrAdmin]
    def get(self, request, company_id):
        return exports.diagnostic_pdf(Company.objects.get(pk=company_id))

class ValidationCheckView(APIView):
    """Contrôle avant validation (§22)."""
    def get(self, request, company_id):
        company = Company.objects.get(pk=company_id)
        if request.user.role == 'company' and request.user.company_id != company.pk:
            return Response(status=403)
        return Response(validation_report(company))

class DeclarationPdfView(APIView):
    permission_classes = [IsConsultantOrAdmin]
    def get(self, request, company_id):
        return exports.declaration_pdf(Company.objects.get(pk=company_id))

class DashboardView(APIView):
    """KPIs consultant (§7)."""
    def get(self, request):
        user = request.user
        companies = Company.objects.all() if user.role != 'company' \
            else Company.objects.filter(pk=user.company_id)
        procs = ProcessingActivity.objects.filter(company__in=companies)
        today = timezone.now().date()
        scores = [s['global'] for c in companies if (s := company_score(c))['global'] is not None]
        return Response({
            'companies': companies.count(),
            'processings': procs.exclude(status__in=['propose','rejete']).count(),
            'processings_to_check': procs.filter(status__in=['propose','a_verifier']).count(),
            'critical_gaps': Gap.objects.filter(company__in=companies, is_open=True,
                                                severity='critique').count(),
            'open_gaps': Gap.objects.filter(company__in=companies, is_open=True).count(),
            'late_actions': Action.objects.filter(company__in=companies, due_date__lt=today)
                                          .exclude(status__in=['termine','valide']).count(),
            'avg_score': round(sum(scores)/len(scores)) if scores else None,
            'by_status': dict(procs.values_list('status').annotate(c=Count('id'))),
        })
