from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsConsultantOrAdmin(BasePermission):
    """Écriture réservée aux consultants/admins ; lecture selon le scope du queryset."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_consultant_or_admin

def scope_to_company(qs, user, field='company'):
    """Isolation des données : un compte entreprise ne voit que sa propre entreprise."""
    if user.role in ('admin', 'consultant', 'auditor'):
        return qs
    if user.company_id:
        return qs.filter(**{f'{field}_id': user.company_id})
    return qs.none()
