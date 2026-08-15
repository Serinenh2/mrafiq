from django.conf import settings
from django.db import models
from mrafiq.fields import EncryptedTextField

class Question(models.Model):
    class QType(models.TextChoices):
        YESNO = 'yesno'; TEXT = 'text'; CHOICE = 'choice'
    code = models.CharField(max_length=32, unique=True)
    section = models.CharField(max_length=64, blank=True)
    text_fr = models.TextField()
    text_ar = models.TextField(blank=True)
    rationale_fr = models.TextField('Pourquoi cette question ?', blank=True)
    rationale_ar = models.TextField(blank=True)
    qtype = models.CharField(max_length=8, choices=QType.choices, default=QType.YESNO)
    choices = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_root = models.BooleanField(default=True)  # visible d'emblée ; sinon déclenchée par une règle
    active = models.BooleanField(default=True)
    class Meta: ordering = ['order']
    def __str__(self): return self.code

class QuestionRule(models.Model):
    """Moteur de règles administrable (§35) : IF réponse = valeur THEN action(cible)."""
    class Action(models.TextChoices):
        SHOW_QUESTION = 'show_question'
        PROPOSE_PROCESSING = 'propose_processing'
        OPEN_MODULE = 'open_module'
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='rules')
    expected_value = models.CharField(max_length=64, default='oui')
    action = models.CharField(max_length=24, choices=Action.choices)
    target = models.CharField(max_length=128)  # code question / nom du traitement / code module
    active = models.BooleanField(default=True)

class Diagnostic(models.Model):
    """Un entretien guidé (§11) : contexte + réponses collectées pour une entreprise."""
    class Status(models.TextChoices):
        EN_COURS = 'en_cours'; TERMINE = 'termine'
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='diagnostics')
    service = models.CharField('Service', max_length=128, blank=True)
    respondent_name = models.CharField('Responsable interrogé', max_length=128, blank=True)
    respondent_role = models.CharField('Fonction', max_length=128, blank=True)
    processing = models.ForeignKey('processing.ProcessingActivity', null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='diagnostics')
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.EN_COURS)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

class Answer(models.Model):
    diagnostic = models.ForeignKey(Diagnostic, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='+')
    value = EncryptedTextField(blank=True)  # chiffré au repos (§26)
    comment = EncryptedTextField(blank=True)  # chiffré au repos (§26)
    evidence = models.FileField('Pièce justificative', upload_to='diagnostic_evidence/%Y/%m/', null=True, blank=True)
    answered_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: unique_together = [('diagnostic', 'question')]
