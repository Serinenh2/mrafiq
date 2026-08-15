from rest_framework.permissions import BasePermission, SAFE_METHODS

CROSS_COMPANY_ROLES = ('admin', 'consultant', 'auditor')

def is_scoped_to_own_company(user):
    """Vrai si ce rôle ne doit voir que les données de sa propre entreprise
    (rôles 'company' et 'org_user' — §33)."""
    return user.role not in CROSS_COMPANY_ROLES

class IsConsultantOrAdmin(BasePermission):
    """Écriture réservée aux consultants/admins ; lecture selon le scope du queryset.
    Le rôle 'org_user' (§33) n'a accès qu'au questionnaire (diagnostics) — jamais aux
    vues utilisant cette permission."""
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user.role == 'org_user':
            return False
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_consultant_or_admin

class BlockOrgUser(BasePermission):
    """Comme IsAuthenticated, mais exclut le rôle 'org_user' (accès limité au questionnaire)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role != 'org_user'

class ReadAnyWriteConsultant(BasePermission):
    """Lecture ouverte à tout authentifié (y compris 'org_user', scope entreprise géré par la
    vue) ; écriture réservée aux consultants/admins. Utilisé pour la fiche entreprise elle-même,
    dont le contexte (nom, secteur…) reste consultable par l'utilisateur organisation (§33)."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_consultant_or_admin

def scope_to_company(qs, user, field='company'):
    """Isolation des données : un compte entreprise ne voit que sa propre entreprise."""
    if not is_scoped_to_own_company(user):
        return qs
    if user.company_id:
        return qs.filter(**{f'{field}_id': user.company_id})
    return qs.none()
