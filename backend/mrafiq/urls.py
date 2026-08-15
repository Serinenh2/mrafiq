from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view()),
    path('api/auth/token/refresh/', TokenRefreshView.as_view()),
    path('api/', include('accounts.urls')),
    path('api/', include('companies.urls')),
    path('api/', include('diagnostics.urls')),
    path('api/', include('processing.urls')),
    path('api/', include('compliance.urls')),
    path('api/', include('audit.urls')),
    path('api/', include('missions.urls')),
    path('api/', include('documents.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
