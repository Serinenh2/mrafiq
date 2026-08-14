from django.conf import settings
from django.db import models

class RefBase(models.Model):
    code = models.CharField(max_length=48, unique=True)
    label_fr = models.CharField(max_length=128)
    label_ar = models.CharField(max_length=128, blank=True)
    class Meta: abstract = True; ordering = ['code']
    def __str__(self): return self.label_fr

class PersonalDataCategory(RefBase): pass
class DataSubjectCategory(RefBase): pass
class SecurityMeasure(RefBase): pass

class Processor(models.Model):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='processors')
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=255, blank=True)
    service = models.CharField('Nature du service', max_length=255, blank=True)
    has_contract = models.BooleanField(default=False)
    contract_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    def __str__(self): return self.name

class ProcessingActivity(models.Model):
    class Status(models.TextChoices):
        PROPOSE = 'propose', 'Proposé'
        BROUILLON = 'brouillon', 'Brouillon'
        RENSEIGNE = 'renseigne', 'Renseigné'
        A_VERIFIER = 'a_verifier', 'À vérifier'
        VERIFIE = 'verifie', 'Vérifié'
        VALIDE = 'valide', 'Validé'
        REJETE = 'rejete', 'Rejeté'
    class Storage(models.TextChoices):
        PAPIER = 'papier'; INFORMATIQUE = 'informatique'; MIXTE = 'mixte'

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='processings')
    reference = models.CharField(max_length=16, blank=True)  # TRT-0001, généré au save
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    purpose = models.TextField('Finalité', blank=True)
    department = models.CharField('Service responsable', max_length=128, blank=True)
    owner_name = models.CharField('Responsable', max_length=128, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.BROUILLON)

    subject_categories = models.ManyToManyField(DataSubjectCategory, blank=True)
    data_categories = models.ManyToManyField(PersonalDataCategory, blank=True)
    security_measures = models.ManyToManyField(SecurityMeasure, blank=True)
    processors = models.ManyToManyField(Processor, blank=True)

    data_sources = models.CharField('Origine des données', max_length=255, blank=True)
    storage_type = models.CharField(max_length=16, choices=Storage.choices, blank=True)
    retention_duration = models.CharField(max_length=128, blank=True)
    retention_location = models.CharField(max_length=255, blank=True)
    recipients = models.TextField('Destinataires', blank=True)

    interconnection = models.BooleanField(default=False)
    interconnection_details = models.TextField(blank=True)
    transfer_abroad = models.BooleanField(default=False)
    transfer_country = models.CharField(max_length=128, blank=True)
    transfer_recipient = models.CharField(max_length=255, blank=True)
    transfer_details = models.TextField(blank=True)

    consent_required = models.BooleanField(default=False)
    consent_method = models.CharField(max_length=255, blank=True)
    consent_proof = models.CharField(max_length=255, blank=True)
    rights_information = models.TextField("Information & droits des personnes", blank=True)

    created_from = models.CharField(max_length=16, default='manual')  # manual / diagnostic / ai
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta: ordering = ['reference']
    def __str__(self): return f'{self.reference} {self.name}'
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.reference:
            self.reference = f'TRT-{self.pk:04d}'
            super().save(update_fields=['reference'])

class ProcessingTemplate(models.Model):
    """Catalogue de traitements types par secteur d'activité (référentiel importé)."""
    ref_id = models.PositiveIntegerField(unique=True)
    domain_fr = models.CharField(max_length=255)
    domain_ar = models.CharField(max_length=255, blank=True)
    name_fr = models.CharField(max_length=255)
    name_ar = models.CharField(max_length=255, blank=True)
    purpose_fr = models.TextField(blank=True)
    purpose_ar = models.TextField(blank=True)
    category_fr = models.TextField(blank=True)
    category_ar = models.TextField(blank=True)
    subject_categories_fr = models.TextField(blank=True)
    subject_categories_ar = models.TextField(blank=True)
    data_categories_fr = models.TextField(blank=True)
    data_categories_ar = models.TextField(blank=True)
    retention_fr = models.CharField(max_length=255, blank=True)
    retention_ar = models.CharField(max_length=255, blank=True)

    class Meta: ordering = ['domain_fr', 'name_fr']
    def __str__(self): return f'{self.domain_fr} — {self.name_fr}'
