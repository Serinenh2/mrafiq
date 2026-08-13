from django.conf import settings
from django.db import models

class AuditLog(models.Model):
    """Journal d'audit non modifiable (§27) : écriture via code serveur uniquement."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    action = models.CharField(max_length=16)  # create / update / delete
    model = models.CharField(max_length=64)
    object_id = models.CharField(max_length=32)
    object_repr = models.CharField(max_length=255)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
