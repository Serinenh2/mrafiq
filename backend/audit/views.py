from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, BasePermission
from .models import AuditLog
from .serializers import AuditLogSerializer

class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [IsPlatformAdmin]
