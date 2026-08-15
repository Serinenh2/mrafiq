from django.conf import settings
from django.db import models

class DocumentTemplate(models.Model):
    class Category(models.TextChoices):
        CHARTE = 'charte', 'Charte'
        ENGAGEMENT = 'engagement', 'Engagement'
        NOTE = 'note', "Note d'information"
        POLITIQUE = 'politique', 'Politique'
        CONTRAT = 'contrat', 'Contrat'
        DECISION = 'decision', 'Décision'

    code = models.SlugField(unique=True)
    title_fr = models.CharField(max_length=255)
    title_ar = models.CharField(max_length=255)
    description_fr = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    category = models.CharField(max_length=16, choices=Category.choices)
    source_file = models.FileField(upload_to='document_templates/')
    mergeable = models.BooleanField(
        default=False,
        help_text="Le nom de l'entreprise peut être injecté automatiquement dans ce modèle.")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
    def __str__(self):
        return self.title_fr

class GeneratedDocument(models.Model):
    class Status(models.TextChoices):
        GENERE = 'genere', 'Généré'
        VALIDE = 'valide', 'Validé'

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE,
                                related_name='generated_documents')
    template = models.ForeignKey(DocumentTemplate, on_delete=models.PROTECT, related_name='+')
    file = models.FileField(upload_to='generated_documents/%Y/%m/')
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.GENERE)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    generated_at = models.DateTimeField(auto_now_add=True)
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    validated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-generated_at']
    def __str__(self):
        return f'{self.template.code} · {self.company.name}'
