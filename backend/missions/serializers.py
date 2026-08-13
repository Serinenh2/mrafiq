from rest_framework import serializers
from .models import Mission

class MissionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', default=None, read_only=True)
    consultant_name = serializers.SerializerMethodField()

    class Meta:
        model = Mission
        fields = '__all__'
        read_only_fields = ['reference', 'created_by']

    def get_consultant_name(self, obj):
        if not obj.consultant_id:
            return None
        full = f'{obj.consultant.first_name} {obj.consultant.last_name}'.strip()
        return full or obj.consultant.username
