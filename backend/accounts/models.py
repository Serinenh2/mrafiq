from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrateur'
        CONSULTANT = 'consultant', 'Consultant'
        COMPANY = 'company', 'Entreprise'
        AUDITOR = 'auditor', 'Auditeur'
        ORG_USER = 'org_user', 'Utilisateur organisation'
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.CONSULTANT)
    company = models.ForeignKey('companies.Company', null=True, blank=True,
                                on_delete=models.SET_NULL, related_name='users')
    phone = models.CharField(max_length=32, blank=True)
    preferred_language = models.CharField(max_length=2, choices=[('fr','fr'),('ar','ar')], default='fr')

    @property
    def is_consultant_or_admin(self):
        return self.role in (self.Role.ADMIN, self.Role.CONSULTANT)
