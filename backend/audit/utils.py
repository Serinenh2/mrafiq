from django.forms.models import model_to_dict
from rest_framework import viewsets
from .models import AuditLog

def _snap(instance):
    try:
        d = model_to_dict(instance)
        return {k: str(v) for k, v in d.items() if not hasattr(v, 'file')}
    except Exception:
        return None

def log(user, action, instance, old=None, request=None):
    AuditLog.objects.create(
        user=user if getattr(user, 'is_authenticated', False) else None,
        action=action, model=instance.__class__.__name__,
        object_id=str(instance.pk), object_repr=str(instance)[:255],
        old_value=old, new_value=_snap(instance) if action != 'delete' else None,
        ip=request.META.get('REMOTE_ADDR') if request else None)

class AuditModelViewSet(viewsets.ModelViewSet):
    """ViewSet avec journalisation automatique create/update/delete."""
    def _audit_save(self, serializer, **extra):
        instance = serializer.save(**extra)
        log(self.request.user, 'create', instance, request=self.request)
        return instance
    def perform_create(self, serializer):
        self._audit_save(serializer)
    def perform_update(self, serializer):
        old = _snap(serializer.instance)
        instance = serializer.save()
        log(self.request.user, 'update', instance, old=old, request=self.request)
    def perform_destroy(self, instance):
        log(self.request.user, 'delete', instance, old=_snap(instance), request=self.request)
        instance.delete()
