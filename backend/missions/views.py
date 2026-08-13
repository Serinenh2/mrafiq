from accounts.permissions import IsConsultantOrAdmin, scope_to_company
from audit.utils import AuditModelViewSet
from .models import Mission
from .serializers import MissionSerializer

class MissionViewSet(AuditModelViewSet):
    serializer_class = MissionSerializer
    permission_classes = [IsConsultantOrAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = scope_to_company(Mission.objects.select_related('company', 'consultant'), self.request.user)
        company = self.request.query_params.get('company')
        status_ = self.request.query_params.get('status')
        if company:
            qs = qs.filter(company_id=company)
        if status_:
            qs = qs.filter(status=status_)
        return qs

    def perform_create(self, serializer):
        self._audit_save(serializer, created_by=self.request.user)
