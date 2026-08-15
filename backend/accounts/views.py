from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from .permissions import IsConsultantOrAdmin
from .serializers import UserSerializer

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

class LockoutTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Verrouille temporairement un compte après plusieurs échecs de connexion (§26)."""
    def validate(self, attrs):
        user = User.objects.filter(username=attrs.get('username')).first()
        if user and user.locked_until and user.locked_until > timezone.now():
            remaining = max(1, int((user.locked_until - timezone.now()).total_seconds() // 60) + 1)
            raise AuthenticationFailed(
                f"Compte temporairement verrouillé après plusieurs échecs. Réessayez dans {remaining} min.")
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            if user:
                user.failed_login_attempts += 1
                just_locked = user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS
                if just_locked:
                    user.locked_until = timezone.now() + timedelta(minutes=LOCKOUT_MINUTES)
                    user.failed_login_attempts = 0
                user.save(update_fields=['failed_login_attempts', 'locked_until'])
                if just_locked:
                    raise AuthenticationFailed(
                        f"Compte verrouillé après {MAX_LOGIN_ATTEMPTS} échecs de connexion. "
                        f"Réessayez dans {LOCKOUT_MINUTES} min.")
            raise
        if user and (user.failed_login_attempts or user.locked_until):
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save(update_fields=['failed_login_attempts', 'locked_until'])
        return data

class LockoutTokenObtainPairView(TokenObtainPairView):
    serializer_class = LockoutTokenObtainPairSerializer

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
