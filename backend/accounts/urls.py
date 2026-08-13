from django.urls import path
from .views import MeView, ConsultantListView
urlpatterns = [
    path('auth/me/', MeView.as_view()),
    path('consultants/', ConsultantListView.as_view()),
]
