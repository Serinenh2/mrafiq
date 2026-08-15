from django.conf import settings
from django.db import models

WILAYAS = [(f'{i:02d}', f'{i:02d}') for i in range(1, 59)]

class Company(models.Model):
    name = models.CharField('Raison sociale', max_length=255)
    legal_form = models.CharField(max_length=64, blank=True)
    sector = models.CharField(max_length=128, blank=True)
    main_activity = models.CharField(max_length=255, blank=True)
    secondary_activities = models.TextField(blank=True)
    rc_number = models.CharField('Registre de commerce', max_length=64, blank=True)
    nif = models.CharField('NIF', max_length=64, blank=True)
    nis = models.CharField('NIS', max_length=64, blank=True)
    address = models.CharField(max_length=255, blank=True)
    wilaya = models.CharField(max_length=2, choices=WILAYAS, blank=True)
    commune = models.CharField(max_length=128, blank=True)
    website = models.URLField('Site internet', blank=True)
    internal_organisation = models.TextField('Organisation interne', blank=True)
    employees_count = models.PositiveIntegerField(default=0)
    contact_name = models.CharField(max_length=128, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    it_systems = models.TextField('Systèmes et logiciels', blank=True)
    it_providers = models.TextField('Prestataires informatiques', blank=True)
    notes = models.TextField(blank=True)

    # Responsable des traitements
    controller_name = models.CharField('Nom et prénom', max_length=128, blank=True)
    controller_qualite = models.CharField('Qualité', max_length=128, blank=True)
    controller_phone = models.CharField('Téléphone', max_length=32, blank=True)
    controller_email = models.EmailField('Email', blank=True)

    # Délégué à la protection des données (DPO)
    class DpoStatus(models.TextChoices):
        AUCUN = 'aucun', 'Sans DPO'
        EN_COURS = 'en_cours', 'En cours de désignation'
        DESIGNE = 'designe', 'Désigné'
    dpo_status = models.CharField(max_length=16, choices=DpoStatus.choices, default=DpoStatus.AUCUN)
    dpo_name = models.CharField('Nom et prénom', max_length=128, blank=True)
    dpo_phone = models.CharField('Téléphone', max_length=32, blank=True)
    dpo_email = models.EmailField('Email', blank=True)
    dpo_specialite = models.CharField('Diplôme ou spécialité', max_length=255, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
    def __str__(self): return self.name

class CompanySite(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='sites')
    name = models.CharField(max_length=128)
    address = models.CharField(max_length=255, blank=True)
    wilaya = models.CharField(max_length=2, choices=WILAYAS, blank=True)

class Department(models.Model):
    """Organigramme : un service/département de l'entreprise et son responsable."""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField('Service / Département', max_length=128)
    manager_name = models.CharField('Nom et prénom du responsable', max_length=128, blank=True)
    manager_phone = models.CharField('Téléphone du responsable', max_length=32, blank=True)
    manager_email = models.EmailField('Email du responsable', blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
    def __str__(self):
        return f'{self.name} ({self.company.name})'

class SecurityChecklistItem(models.Model):
    """Module de sécurité — checklist organisationnelle fixe par entreprise."""
    class Item(models.TextChoices):
        ACCES = 'acces', "Contrôle d'accès"
        AUTHENTIFICATION = 'authentification', 'Authentification'
        MOTS_DE_PASSE = 'mots_de_passe', 'Mots de passe'
        SAUVEGARDES = 'sauvegardes', 'Sauvegardes'
        ANTIVIRUS = 'antivirus', 'Antivirus'
        PAREFEU = 'parefeu', 'Pare-feu'
        CHIFFREMENT = 'chiffrement', 'Chiffrement'
        JOURNALISATION = 'journalisation', 'Journalisation'
        HABILITATIONS = 'habilitations', 'Contrôle des habilitations'
        PHYSIQUE = 'physique', 'Sécurité physique'
        INCIDENTS = 'incidents', 'Gestion des incidents'
        CONFIDENTIALITE = 'confidentialite', 'Confidentialité'
        SENSIBILISATION = 'sensibilisation', 'Sensibilisation du personnel'
        CHARTE = 'charte', 'Charte de sécurité'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='security_checklist')
    item = models.CharField(max_length=24, choices=Item.choices)
    in_place = models.BooleanField(null=True, blank=True)  # None = à vérifier
    notes = models.TextField(blank=True)
    evidence = models.FileField(upload_to='security_evidence/%Y/%m/', null=True, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('company', 'item')]
        ordering = ['item']
    def __str__(self):
        return f'{self.item} ({self.company.name})'

class RightsProcedure(models.Model):
    """Module droits des personnes — un enregistrement par droit et par entreprise."""
    class Droit(models.TextChoices):
        INFORMATION = 'information', "Droit à l'information"
        ACCES = 'acces', "Droit d'accès"
        RECTIFICATION = 'rectification', 'Droit de rectification'
        OPPOSITION = 'opposition', "Droit d'opposition"
    class Niveau(models.TextChoices):
        A_VERIFIER = 'a_verifier', 'À vérifier'
        CONFORME = 'conforme', 'Conforme'
        PARTIEL = 'partiel', 'Partiel'
        NON_CONFORME = 'non_conforme', 'Non conforme'

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='rights_procedures')
    droit = models.CharField(max_length=16, choices=Droit.choices)
    mecanisme_existe = models.BooleanField(null=True, blank=True)
    procedure = models.TextField(blank=True)
    responsable = models.CharField(max_length=128, blank=True)
    delai_interne = models.CharField(max_length=64, blank=True)
    formulaire_existe = models.BooleanField(default=False)
    preuve = models.FileField(upload_to='rights_evidence/%Y/%m/', null=True, blank=True)
    niveau = models.CharField(max_length=16, choices=Niveau.choices, default=Niveau.A_VERIFIER)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('company', 'droit')]
        ordering = ['droit']
    def __str__(self):
        return f'{self.droit} ({self.company.name})'
