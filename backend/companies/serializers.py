from rest_framework import serializers
from .models import Company, CompanySite, Department, SecurityChecklistItem, RightsProcedure

class CompanySiteSerializer(serializers.ModelSerializer):
    class Meta: model = CompanySite; fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta: model = Department; fields = '__all__'

class SecurityChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityChecklistItem; fields = '__all__'
        read_only_fields = ['updated_by']

class RightsProcedureSerializer(serializers.ModelSerializer):
    class Meta:
        model = RightsProcedure; fields = '__all__'
        read_only_fields = ['updated_by']

class CompanySerializer(serializers.ModelSerializer):
    sites = CompanySiteSerializer(many=True, read_only=True)
    departments = DepartmentSerializer(many=True, read_only=True)
    processing_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['created_by']
