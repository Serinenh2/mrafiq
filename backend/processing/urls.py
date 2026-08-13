from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import RefsView, ProcessorViewSet, ProcessingViewSet
router = DefaultRouter()
router.register('processors', ProcessorViewSet, basename='processor')
router.register('processings', ProcessingViewSet, basename='processing')
urlpatterns = [path('refs/', RefsView.as_view())] + router.urls
