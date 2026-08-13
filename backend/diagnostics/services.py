"""Moteur du questionnaire dynamique : questions visibles + effets des règles."""
from processing.models import ProcessingActivity
from .models import Question, QuestionRule, Answer

def visible_questions(diagnostic):
    answers = {a.question.code: a.value.strip().lower() for a in
               diagnostic.answers.select_related('question')}
    shown = set(Question.objects.filter(active=True, is_root=True).values_list('code', flat=True))
    # propagation : les règles satisfaites révèlent d'autres questions
    changed = True
    while changed:
        changed = False
        rules = QuestionRule.objects.filter(active=True, action='show_question',
                                            question__code__in=list(answers.keys()))
        for r in rules:
            if answers.get(r.question.code) == r.expected_value.lower() and r.target not in shown:
                shown.add(r.target); changed = True
    return Question.objects.filter(active=True, code__in=shown).order_by('order'), answers

def apply_rules(diagnostic, answer):
    """Retourne les effets déclenchés par une réponse (traitements proposés, modules)."""
    effects = {'proposed_processings': [], 'opened_modules': [], 'new_questions': []}
    val = answer.value.strip().lower()
    for r in answer.question.rules.filter(active=True):
        if val != r.expected_value.lower():
            continue
        if r.action == QuestionRule.Action.PROPOSE_PROCESSING:
            obj, created = ProcessingActivity.objects.get_or_create(
                company=diagnostic.company, name=r.target,
                defaults={'status': 'propose', 'created_from': 'diagnostic',
                          'description': f"Proposé automatiquement par le diagnostic ({answer.question.code})."})
            if created:
                effects['proposed_processings'].append(obj.name)
        elif r.action == QuestionRule.Action.OPEN_MODULE:
            effects['opened_modules'].append(r.target)
        elif r.action == QuestionRule.Action.SHOW_QUESTION:
            effects['new_questions'].append(r.target)
    return effects
