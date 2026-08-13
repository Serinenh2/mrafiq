from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet, log
from .models import Question, Diagnostic, Answer
from .serializers import QuestionSerializer, DiagnosticSerializer, AnswerSerializer
from .services import visible_questions, apply_rules

class QuestionViewSet(AuditModelViewSet):
    queryset = Question.objects.filter(active=True)
    serializer_class = QuestionSerializer
    permission_classes = [IsConsultantOrAdmin]

class DiagnosticViewSet(AuditModelViewSet):
    serializer_class = DiagnosticSerializer
    def get_queryset(self):
        return scope_to_company(
            Diagnostic.objects.select_related('company').prefetch_related('answers__question'),
            self.request.user)
    def perform_create(self, serializer):
        self._audit_save(serializer, created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Questions visibles compte tenu des réponses déjà données (moteur §9/§35)."""
        diag = self.get_object()
        qs, answers = visible_questions(diag)
        data = QuestionSerializer(qs, many=True).data
        for q in data:
            q['answer'] = answers.get(q['code'])
        return Response(data)

    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        """Enregistre une réponse, applique les règles, renvoie les effets déclenchés."""
        diag = self.get_object()
        question = Question.objects.get(code=request.data['question_code'])
        ans, _ = Answer.objects.update_or_create(
            diagnostic=diag, question=question,
            defaults={'value': str(request.data.get('value', '')),
                      'comment': request.data.get('comment', ''),
                      'answered_by': request.user})
        log(request.user, 'update', ans, request=request)
        effects = apply_rules(diag, ans)
        qs, answers = visible_questions(diag)
        data = QuestionSerializer(qs, many=True).data
        for q in data:
            q['answer'] = answers.get(q['code'])
        return Response({'effects': effects, 'questions': data})
