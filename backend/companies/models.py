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
    address = models.CharField(max_length=255, blank=True)
    wilaya = models.CharField(max_length=2, choices=WILAYAS, blank=True)
    employees_count = models.PositiveIntegerField(default=0)
    contact_name = models.CharField(max_length=128, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    it_systems = models.TextField('Systèmes et logiciels', blank=True)
    it_providers = models.TextField('Prestataires informatiques', blank=True)
    notes = models.TextField(blank=True)
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
