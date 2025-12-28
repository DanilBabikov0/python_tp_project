from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('auth/', views.auth_page, name='auth_page'),
    path('profile/', views.profile, name='profile'),
]