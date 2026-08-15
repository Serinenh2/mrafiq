from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from accounts.permissions import IsConsultantOrAdmin, scope_to_company, is_scoped_to_own_company
from audit.utils import AuditModelViewSet, log
from .models import Question, Diagnostic, Answer
from .serializers import QuestionSerializer, DiagnosticSerializer, AnswerSerializer
from .services import visible_questions, known_answers, apply_rules

class QuestionViewSet(AuditModelViewSet):
    queryset = Question.objects.filter(active=True)
    serializer_class = QuestionSerializer
    permission_classes = [IsConsultantOrAdmin]

def _questions_payload(diag):
    """Questions visibles + réponse courante + mémoire du dossier (§9/§12/§35)."""
    qs, answers = visible_questions(diag)
    known = known_answers(diag)
    data = QuestionSerializer(qs, many=True).data
    for q in data:
        q['answer'] = answers.get(q['code'])
        q['known'] = known.get(q['code']) if q['answer'] is None else None
    return data

class DiagnosticViewSet(AuditModelViewSet):
    serializer_class = DiagnosticSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_queryset(self):
        return scope_to_company(
            Diagnostic.objects.select_related('company', 'processing').prefetch_related('answers__question'),
            self.request.user)
    def perform_create(self, serializer):
        company = serializer.validated_data.get('company')
        user = self.request.user
        if is_scoped_to_own_company(user) and company and company.pk != user.company_id:
            raise PermissionDenied("Entreprise non autorisée.")
        self._audit_save(serializer, created_by=user)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Questions visibles compte tenu des réponses déjà données (moteur §9/§35)."""
        return Response(_questions_payload(self.get_object()))

    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        """Enregistre une réponse, applique les règles, renvoie les effets déclenchés."""
        diag = self.get_object()
        question = Question.objects.get(code=request.data['question_code'])
        defaults = {'value': str(request.data.get('value', '')),
                    'comment': request.data.get('comment', ''),
                    'answered_by': request.user}
        if 'evidence' in request.data:  # ne touche au fichier que si un nouveau est envoyé
            defaults['evidence'] = request.data.get('evidence')
        ans, _ = Answer.objects.update_or_create(
            diagnostic=diag, question=question, defaults=defaults)
        log(request.user, 'update', ans, request=request)
        effects = apply_rules(diag, ans)
        return Response({'effects': effects, 'questions': _questions_payload(diag)})
