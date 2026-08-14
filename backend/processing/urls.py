from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import RefsView, ProcessorViewSet, ProcessingViewSet, ProcessingTemplateViewSet
router = DefaultRouter()
router.register('processors', ProcessorViewSet, basename='processor')
router.register('processings', ProcessingViewSet, basename='processing')
router.register('processing-templates', ProcessingTemplateViewSet, basename='processing-template')
urlpatterns = [path('refs/', RefsView.as_view())] + router.urls
