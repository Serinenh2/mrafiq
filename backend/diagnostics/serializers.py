from rest_framework import serializers
from .models import Question, QuestionRule, Diagnostic, Answer

class QuestionRuleSerializer(serializers.ModelSerializer):
    class Meta: model = QuestionRule; fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    rules = QuestionRuleSerializer(many=True, read_only=True)
    class Meta: model = Question; fields = '__all__'

class AnswerSerializer(serializers.ModelSerializer):
    question_code = serializers.CharField(source='question.code', read_only=True)
    class Meta:
        model = Answer; fields = '__all__'
        read_only_fields = ['answered_by']

class DiagnosticSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    processing_name = serializers.CharField(source='processing.name', default=None, read_only=True)
    class Meta:
        model = Diagnostic; fields = '__all__'
        read_only_fields = ['created_by']
