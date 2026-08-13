from rest_framework import serializers
from .models import Domain, LegalReference, Requirement, Assessment, Gap, Action

class DomainSerializer(serializers.ModelSerializer):
    class Meta: model = Domain; fields = '__all__'

class LegalReferenceSerializer(serializers.ModelSerializer):
    class Meta: model = LegalReference; fields = '__all__'

class RequirementSerializer(serializers.ModelSerializer):
    domain_code = serializers.CharField(source='domain.code', read_only=True)
    legal = serializers.CharField(source='legal_reference.__str__', read_only=True)
    class Meta: model = Requirement; fields = '__all__'

class AssessmentSerializer(serializers.ModelSerializer):
    requirement_code = serializers.CharField(source='requirement.code', read_only=True)
    requirement_text = serializers.CharField(source='requirement.text_fr', read_only=True)
    requirement_text_ar = serializers.CharField(source='requirement.text_ar', read_only=True)
    domain_code = serializers.CharField(source='requirement.domain.code', read_only=True)
    class Meta:
        model = Assessment; fields = '__all__'
        read_only_fields = ['updated_by']

class GapSerializer(serializers.ModelSerializer):
    processing_name = serializers.CharField(source='processing.name', default=None, read_only=True)
    processing_ref = serializers.CharField(source='processing.reference', default=None, read_only=True)
    requirement_code = serializers.CharField(source='requirement.code', default=None, read_only=True)
    class Meta: model = Gap; fields = '__all__'

class ActionSerializer(serializers.ModelSerializer):
    processing_name = serializers.CharField(source='processing.name', default=None, read_only=True)
    class Meta:
        model = Action; fields = '__all__'
        read_only_fields = ['reference']
