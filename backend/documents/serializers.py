from rest_framework import serializers
from .models import DocumentTemplate, GeneratedDocument

class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate; fields = '__all__'

class GeneratedDocumentSerializer(serializers.ModelSerializer):
    template_title_fr = serializers.CharField(source='template.title_fr', read_only=True)
    template_title_ar = serializers.CharField(source='template.title_ar', read_only=True)
    template_category = serializers.CharField(source='template.category', read_only=True)
    class Meta:
        model = GeneratedDocument; fields = '__all__'
        read_only_fields = ['status', 'generated_by', 'validated_by', 'validated_at']
