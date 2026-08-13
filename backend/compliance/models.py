from django.conf import settings
from django.db import models

class Domain(models.Model):
    """Domaines du score (§18) — poids configurables."""
    code = models.CharField(max_length=48, unique=True)
    label_fr = models.CharField(max_length=128)
    label_ar = models.CharField(max_length=128, blank=True)
    weight = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']
    def __str__(self): return self.label_fr

class LegalReference(models.Model):
    """Référentiel juridique administrable (§15/§37)."""
    text_name = models.CharField(max_length=255)      # ex. Loi n° 18-07
    article = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    version = models.CharField(max_length=32, blank=True)
    def __str__(self): return f'{self.text_name} {self.article}'.strip()

class Requirement(models.Model):
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='requirements')
    legal_reference = models.ForeignKey(LegalReference, null=True, blank=True,
                                        on_delete=models.SET_NULL, related_name='requirements')
    code = models.CharField(max_length=32, unique=True)
    text_fr = models.TextField()
    text_ar = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    def __str__(self): return self.code

class Assessment(models.Model):
    """Évaluation exigence × traitement — sortie du moteur (§15)."""
    class Status(models.TextChoices):
        CONFORME = 'conforme'
        PARTIEL = 'partiel'
        NON_CONFORME = 'non_conforme'
        MANQUANT = 'manquant'
        A_VERIFIER = 'a_verifier'
    processing = models.ForeignKey('processing.ProcessingActivity',
                                   on_delete=models.CASCADE, related_name='assessments')
    requirement = models.ForeignKey(Requirement, on_delete=models.CASCADE, related_name='assessments')
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.A_VERIFIER)
    note = models.TextField(blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: unique_together = [('processing', 'requirement')]

class Gap(models.Model):
    """Matrice des écarts (§16)."""
    class Severity(models.TextChoices):
        CRITIQUE = 'critique'; ELEVE = 'eleve'; MOYEN = 'moyen'; FAIBLE = 'faible'
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='gaps')
    processing = models.ForeignKey('processing.ProcessingActivity', null=True,
                                   on_delete=models.CASCADE, related_name='gaps')
    requirement = models.ForeignKey(Requirement, null=True, on_delete=models.SET_NULL, related_name='+')
    description = models.TextField()
    severity = models.CharField(max_length=16, choices=Severity.choices, default=Severity.MOYEN)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Action(models.Model):
    """Plan d'action (§17)."""
    class Status(models.TextChoices):
        A_FAIRE = 'a_faire', 'À faire'
        EN_COURS = 'en_cours', 'En cours'
        EN_ATTENTE = 'en_attente', 'En attente'
        TERMINE = 'termine', 'Terminé'
        VALIDE = 'valide', 'Validé'
    class Priority(models.TextChoices):
        HAUTE = 'haute'; MOYENNE = 'moyenne'; BASSE = 'basse'
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='actions')
    processing = models.ForeignKey('processing.ProcessingActivity', null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='actions')
    gap = models.ForeignKey(Gap, null=True, blank=True, on_delete=models.SET_NULL, related_name='actions')
    reference = models.CharField(max_length=16, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assignee = models.CharField('Responsable', max_length=128, blank=True)
    priority = models.CharField(max_length=8, choices=Priority.choices, default=Priority.MOYENNE)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.A_FAIRE)
    comment = models.TextField(blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['due_date']
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.reference:
            self.reference = f'ACT-{self.pk:04d}'
            super().save(update_fields=['reference'])

class SystemSetting(models.Model):
    key = models.CharField(max_length=64, unique=True)
    value = models.JSONField()
    @classmethod
    def get(cls, key, default=None):
        obj = cls.objects.filter(key=key).first()
        return obj.value if obj else default

DEFAULT_SCORE_LEVELS = [
    {'min': 0,  'max': 39,  'code': 'critique',      'fr': 'Critique',      'ar': 'حرِج'},
    {'min': 40, 'max': 59,  'code': 'faible',        'fr': 'Faible',        'ar': 'ضعيف'},
    {'min': 60, 'max': 79,  'code': 'intermediaire', 'fr': 'Intermédiaire', 'ar': 'متوسط'},
    {'min': 80, 'max': 94,  'code': 'bon',           'fr': 'Bon',           'ar': 'جيد'},
    {'min': 95, 'max': 100, 'code': 'tres_bon',      'fr': 'Très bon',      'ar': 'جيد جدًا'},
]
