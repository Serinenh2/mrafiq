from django.contrib import admin
from .models import DocumentTemplate, GeneratedDocument

@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ['code', 'title_fr', 'category', 'mergeable', 'order']
    list_filter = ['category', 'mergeable']

@admin.register(GeneratedDocument)
class GeneratedDocumentAdmin(admin.ModelAdmin):
    list_display = ['template', 'company', 'status', 'generated_at', 'validated_at']
    list_filter = ['status']
