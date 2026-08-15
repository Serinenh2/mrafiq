from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsConsultantOrAdmin, BlockOrgUser, scope_to_company
from audit.utils import AuditModelViewSet, log
from companies.models import Company
from .models import DocumentTemplate, GeneratedDocument
from .serializers import DocumentTemplateSerializer, GeneratedDocumentSerializer
from .services import merge_docx, stamp_docx, stamp_pdf, copy_as_is, preview_payload

class DocumentTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], permission_classes=[IsConsultantOrAdmin])
    def generate(self, request, pk=None):
        """Fusionne (ou copie) le modèle pour une entreprise (§18/§41)."""
        template = self.get_object()
        company = get_object_or_404(Company, pk=request.data.get('company'))
        path = template.source_file.path
        if template.mergeable:
            buf = merge_docx(path, company)
        elif path.lower().endswith('.pdf'):
            buf = stamp_pdf(path, company)
        elif path.lower().endswith('.docx'):
            buf = stamp_docx(path, company)
        else:
            buf = copy_as_is(path)
        ext = template.source_file.name.rsplit('.', 1)[-1]
        doc = GeneratedDocument(company=company, template=template, generated_by=request.user)
        doc.file.save(f'{template.code}-{company.pk}.{ext}', ContentFile(buf.read()), save=False)
        doc.save()
        log(request.user, 'create', doc, request=request)
        return Response(GeneratedDocumentSerializer(doc).data, status=201)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Aperçu en lecture seule du modèle d'origine, avant génération (§18)."""
        template = self.get_object()
        payload = preview_payload(template.source_file.path)
        if payload['type'] == 'pdf':
            payload['url'] = template.source_file.url
        return Response(payload)

class GeneratedDocumentViewSet(AuditModelViewSet):
    serializer_class = GeneratedDocumentSerializer
    permission_classes = [BlockOrgUser]
    def get_queryset(self):
        qs = scope_to_company(
            GeneratedDocument.objects.select_related('company', 'template'), self.request.user)
        company = self.request.query_params.get('company')
        return qs.filter(company_id=company) if company else qs
    def perform_create(self, serializer):
        self._audit_save(serializer, generated_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsConsultantOrAdmin])
    def validate(self, request, pk=None):
        doc = self.get_object()
        doc.status = GeneratedDocument.Status.VALIDE
        doc.validated_by = request.user
        doc.validated_at = timezone.now()
        doc.save()
        log(request.user, 'update', doc, request=request)
        return Response(GeneratedDocumentSerializer(doc).data)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Aperçu en lecture seule du document personnalisé généré (§18)."""
        doc = self.get_object()
        payload = preview_payload(doc.file.path)
        if payload['type'] == 'pdf':
            payload['url'] = doc.file.url
        return Response(payload)
