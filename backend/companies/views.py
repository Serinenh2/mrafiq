from django.db.models import Count
from rest_framework import viewsets
from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet
from .models import Company, CompanySite
from .serializers import CompanySerializer, CompanySiteSerializer

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
