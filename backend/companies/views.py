from django.db.models import Count
from rest_framework import viewsets
from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet
from .models import Company, CompanySite, Department
from .serializers import CompanySerializer, CompanySiteSerializer, DepartmentSerializer

class CompanyViewSet(AuditModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsConsultantOrAdmin]
    def get_queryset(self):
        qs = Company.objects.annotate(processing_count=Count('processings'))
        if self.request.user.role == 'company':
            return qs.filter(id=self.request.user.company_id)
        return qs
    def perform_create(self, serializer):
        self._audit_save(serializer, created_by=self.request.user)

class CompanySiteViewSet(AuditModelViewSet):
    serializer_class = CompanySiteSerializer
    permission_classes = [IsConsultantOrAdmin]
    def get_queryset(self):
        return scope_to_company(CompanySite.objects.all(), self.request.user)

class DepartmentViewSet(AuditModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsConsultantOrAdmin]
    def get_queryset(self):
        qs = scope_to_company(Department.objects.all(), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs
