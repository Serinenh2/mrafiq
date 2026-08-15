from rest_framework.routers import DefaultRouter
from .views import DocumentTemplateViewSet, GeneratedDocumentViewSet
router = DefaultRouter()
router.register('document-templates', DocumentTemplateViewSet, basename='document-template')
router.register('generated-documents', GeneratedDocumentViewSet, basename='generated-document')
urlpatterns = router.urls
