from django.db.models import Count
from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet, log, _snap
from .models import Company, CompanySite, Department, SecurityChecklistItem, RightsProcedure
from .serializers import (CompanySerializer, CompanySiteSerializer, DepartmentSerializer,
                          SecurityChecklistItemSerializer, RightsProcedureSerializer)

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

class SecurityChecklistViewSet(AuditModelViewSet):
    serializer_class = SecurityChecklistItemSerializer
    permission_classes = [IsConsultantOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_queryset(self):
        qs = scope_to_company(SecurityChecklistItem.objects.all(), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs
    def list(self, request, *args, **kwargs):
        company_id = request.query_params.get('company')
        if company_id:
            existing = set(SecurityChecklistItem.objects.filter(company_id=company_id)
                           .values_list('item', flat=True))
            SecurityChecklistItem.objects.bulk_create([
                SecurityChecklistItem(company_id=company_id, item=code)
                for code, _ in SecurityChecklistItem.Item.choices if code not in existing])
        return super().list(request, *args, **kwargs)
    def perform_update(self, serializer):
        old = _snap(serializer.instance)
        instance = serializer.save(updated_by=self.request.user)
        log(self.request.user, 'update', instance, old=old, request=self.request)

class RightsProcedureViewSet(AuditModelViewSet):
    serializer_class = RightsProcedureSerializer
    permission_classes = [IsConsultantOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_queryset(self):
        qs = scope_to_company(RightsProcedure.objects.all(), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs
    def list(self, request, *args, **kwargs):
        company_id = request.query_params.get('company')
        if company_id:
            existing = set(RightsProcedure.objects.filter(company_id=company_id)
                           .values_list('droit', flat=True))
            RightsProcedure.objects.bulk_create([
                RightsProcedure(company_id=company_id, droit=code)
                for code, _ in RightsProcedure.Droit.choices if code not in existing])
        return super().list(request, *args, **kwargs)
    def perform_update(self, serializer):
        old = _snap(serializer.instance)
        instance = serializer.save(updated_by=self.request.user)
        log(self.request.user, 'update', instance, old=old, request=self.request)
