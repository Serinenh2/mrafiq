from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet, _snap, log
from companies.models import Company
from .models import (PersonalDataCategory, DataSubjectCategory, SecurityMeasure,
                     Processor, ProcessingActivity, ProcessingDataItem, ProcessingTemplate)
from .serializers import (DataCatSerializer, SubjectCatSerializer, SecuritySerializer,
                          ProcessorSerializer, ProcessingSerializer, ProcessingDataItemSerializer,
                          ProcessingTemplateSerializer)
from .exports import processing_pdf, processing_template_pdf

class RefsView(APIView):
    def get(self, request):
        return Response({
            'data_categories': DataCatSerializer(PersonalDataCategory.objects.all(), many=True).data,
            'subject_categories': SubjectCatSerializer(DataSubjectCategory.objects.all(), many=True).data,
            'security_measures': SecuritySerializer(SecurityMeasure.objects.all(), many=True).data,
        })

TEMPLATE_FIELDS_FR = ["Domaine d'activité", 'Nom du traitement', 'Finalité du traitement',
    'Catégorie de traitement', 'Personnes concernées',
    'Données collectées et traitées', 'Durée de conservation des données']
TEMPLATE_FIELDS_AR = ['مجال النشاط', 'تسمية المعالجة', 'الغاية من المعالجة',
    'أصناف المعالجة', 'أصناف الأشخاص المعنيين بالمعالجة',
    'أصناف المعطيات المجمعة والمعالجة', 'مدة حفظ المعطيات']

class ProcessingTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """Catalogue de traitements types par secteur — référentiel partagé, lecture seule."""
    queryset = ProcessingTemplate.objects.all()
    serializer_class = ProcessingTemplateSerializer
    pagination_class = None

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Aperçu en lecture seule d'un traitement type (fiche formatée, FR/AR)."""
        tpl = self.get_object()
        ar = request.query_params.get('lang') == 'ar'
        pick = lambda fr, ar_val: (ar_val if ar and ar_val else fr)
        values = [
            pick(tpl.domain_fr, tpl.domain_ar), pick(tpl.name_fr, tpl.name_ar),
            pick(tpl.purpose_fr, tpl.purpose_ar), pick(tpl.category_fr, tpl.category_ar),
            pick(tpl.subject_categories_fr, tpl.subject_categories_ar),
            pick(tpl.data_categories_fr, tpl.data_categories_ar),
            pick(tpl.retention_fr, tpl.retention_ar),
        ]
        labels = TEMPLATE_FIELDS_AR if ar else TEMPLATE_FIELDS_FR
        blocks = [{'type': 'field', 'label': l, 'text': v or '—'} for l, v in zip(labels, values)]
        return Response({'type': 'docx', 'blocks': blocks})

    @action(detail=True, methods=['get'], url_path='export/fiche.pdf')
    def export_fiche(self, request, pk=None):
        tpl = self.get_object()
        company = get_object_or_404(Company, pk=request.query_params.get('company'))
        lang = request.query_params.get('lang', 'fr')
        return processing_template_pdf(tpl, company, lang=lang)

class ProcessorViewSet(AuditModelViewSet):
    serializer_class = ProcessorSerializer
    permission_classes = [IsConsultantOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_queryset(self):
        qs = scope_to_company(Processor.objects.all(), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs

class ProcessingDataItemViewSet(AuditModelViewSet):
    serializer_class = ProcessingDataItemSerializer
    permission_classes = [IsConsultantOrAdmin]
    def get_queryset(self):
        qs = scope_to_company(ProcessingDataItem.objects.select_related('category', 'processing__company'),
                              self.request.user, field='processing__company')
        processing = self.request.query_params.get('processing')
        return qs.filter(processing_id=processing) if processing else qs

class ProcessingViewSet(AuditModelViewSet):
    serializer_class = ProcessingSerializer
    permission_classes = [IsConsultantOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None
    def get_queryset(self):
        qs = scope_to_company(
            ProcessingActivity.objects.select_related('company')
            .prefetch_related('assessments','data_categories','subject_categories',
                              'security_measures','processors','data_items__category'),
            self.request.user)
        company = self.request.query_params.get('company')
        if company: qs = qs.filter(company_id=company)
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs
    def perform_create(self, serializer):
        self._audit_save(serializer, created_by=self.request.user)
    def perform_update(self, serializer):
        old = _snap(serializer.instance)
        instance = serializer.save(version_minor=serializer.instance.version_minor + 1)
        log(self.request.user, 'update', instance, old=old, request=self.request)

    @action(detail=True, methods=['post'])
    def merge(self, request, pk=None):
        """Fusionne un traitement proposé dans un traitement existant (§6)."""
        source = self.get_object()
        target_id = request.data.get('target')
        target = self.get_queryset().filter(pk=target_id).first()
        if not target or target.pk == source.pk:
            return Response({'detail': 'Traitement cible invalide.'}, status=400)
        note = f"\n\n[Fusionné avec {source.reference} « {source.name} »] {source.purpose or ''}".rstrip()
        target.description = (target.description or '') + note
        target.save(update_fields=['description'])
        log(self.request.user, 'update', target, request=self.request)
        log(self.request.user, 'delete', source, request=self.request)
        source.delete()
        return Response(ProcessingSerializer(target).data)

    @action(detail=True, methods=['get'], url_path='export/fiche.pdf')
    def export_fiche(self, request, pk=None):
        return processing_pdf(self.get_object())

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Historique des versions (§31) — réutilise le journal d'audit existant."""
        from audit.models import AuditLog
        from audit.serializers import AuditLogSerializer
        obj = self.get_object()  # applique le scope entreprise
        logs = AuditLog.objects.filter(model='ProcessingActivity', object_id=str(obj.pk)).order_by('created_at')
        return Response(AuditLogSerializer(logs, many=True).data)
