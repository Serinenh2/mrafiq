from rest_framework import serializers
from .models import (PersonalDataCategory, DataSubjectCategory, SecurityMeasure,
                     Processor, ProcessingActivity, ProcessingTemplate)

class RefSerializer(serializers.ModelSerializer):
    class Meta: fields = ['id','code','label_fr','label_ar']
class DataCatSerializer(RefSerializer):
    class Meta(RefSerializer.Meta): model = PersonalDataCategory
class SubjectCatSerializer(RefSerializer):
    class Meta(RefSerializer.Meta): model = DataSubjectCategory
class SecuritySerializer(RefSerializer):
    class Meta(RefSerializer.Meta): model = SecurityMeasure

class ProcessingTemplateSerializer(serializers.ModelSerializer):
    class Meta: model = ProcessingTemplate; fields = '__all__'

class ProcessorSerializer(serializers.ModelSerializer):
    class Meta: model = Processor; fields = '__all__'

class ProcessingSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    conformity = serializers.SerializerMethodField()
    version = serializers.CharField(read_only=True)
    class Meta:
        model = ProcessingActivity; fields = '__all__'
        read_only_fields = ['reference','created_by','created_from','version_major','version_minor']
    def get_conformity(self, obj):
        # calcul léger : moyenne des évaluations existantes
        vals = {'conforme': 100, 'partiel': 50, 'non_conforme': 0, 'manquant': 0}
        scores = [vals[a.status] for a in obj.assessments.all() if a.status in vals]
        return round(sum(scores)/len(scores)) if scores else None
