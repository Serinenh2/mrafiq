from rest_framework.routers import DefaultRouter
from .views import QuestionViewSet, DiagnosticViewSet
router = DefaultRouter()
router.register('questions', QuestionViewSet, basename='question')
router.register('diagnostics', DiagnosticViewSet, basename='diagnostic')
urlpatterns = router.urls
