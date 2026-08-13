from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User
from .permissions import IsConsultantOrAdmin
from .serializers import UserSerializer

class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)
    def patch(self, request):
        s = UserSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True); s.save()
        return Response(s.data)

class ConsultantListView(APIView):
    """Liste des consultants/admins assignables à une mission."""
    permission_classes = [IsConsultantOrAdmin]
    def get(self, request):
        users = User.objects.filter(role__in=('consultant', 'admin')).order_by('first_name', 'username')
        return Response([{'id': u.id, 'username': u.username,
                          'first_name': u.first_name, 'last_name': u.last_name} for u in users])
