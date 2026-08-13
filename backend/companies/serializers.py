from rest_framework import serializers
from .models import Company, CompanySite

class CompanySiteSerializer(serializers.ModelSerializer):
    class Meta: model = CompanySite; fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    sites = CompanySiteSerializer(many=True, read_only=True)
    processing_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['created_by']
