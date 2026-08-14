from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet
from .models import (PersonalDataCategory, DataSubjectCategory, SecurityMeasure,
                     Processor, ProcessingActivity, ProcessingTemplate)
from .serializers import (DataCatSerializer, SubjectCatSerializer, SecuritySerializer,
                          ProcessorSerializer, ProcessingSerializer, ProcessingTemplateSerializer)

class RefsView(APIView):
    def get(self, request):
        return Response({
            'data_categories': DataCatSerializer(PersonalDataCategory.objects.all(), many=True).data,
            'subject_categories': SubjectCatSerializer(DataSubjectCategory.objects.all(), many=True).data,
            'security_measures': SecuritySerializer(SecurityMeasure.objects.all(), many=True).data,
        })

class ProcessingTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """Catalogue de traitements types par secteur — référentiel partagé, lecture seule."""
    queryset = ProcessingTemplate.objects.all()
    serializer_class = ProcessingTemplateSerializer
    pagination_class = None

class ProcessorViewSet(AuditModelViewSet):
    serializer_class = ProcessorSerializer
    permission_classes = [IsConsultantOrAdmin]
    def get_queryset(self):
        qs = scope_to_company(Processor.objects.all(), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs

class ProcessingViewSet(AuditModelViewSet):
    serializer_class = ProcessingSerializer
    permission_classes = [IsConsultantOrAdmin]
    pagination_class = None
    def get_queryset(self):
        qs = scope_to_company(
            ProcessingActivity.objects.select_related('company')
            .prefetch_related('assessments','data_categories','subject_categories',
                              'security_measures','processors'),
            self.request.user)
        company = self.request.query_params.get('company')
        if company: qs = qs.filter(company_id=company)
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs
    def perform_create(self, serializer):
        self._audit_save(serializer, created_by=self.request.user)
