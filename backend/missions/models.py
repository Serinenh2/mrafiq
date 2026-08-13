from django.conf import settings
from django.db import models

class Mission(models.Model):
    """Mission d'accompagnement — entité centrale de l'engagement consultant (§8)."""
    class Status(models.TextChoices):
        PREPARATION = 'preparation', 'Préparation'
        DIAGNOSTIC = 'diagnostic', 'Diagnostic'
        CARTOGRAPHIE = 'cartographie', 'Cartographie'
        ANALYSE = 'analyse', 'Analyse'
        PLAN_ACTION = 'plan_action', "Plan d'action"
        MISE_CONFORMITE = 'mise_conformite', 'Mise en conformité'
        VERIFICATION = 'verification', 'Vérification'
        FINALISATION = 'finalisation', 'Finalisation'
        CLOTUREE = 'cloturee', 'Clôturée'

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='missions')
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='missions')
    reference = models.CharField(max_length=16, blank=True)
    subject = models.CharField('Objet', max_length=255)
    scope = models.TextField('Périmètre', blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PREPARATION)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.reference or self.subject

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.reference:
            self.reference = f'MIS-{self.pk:04d}'
            super().save(update_fields=['reference'])
