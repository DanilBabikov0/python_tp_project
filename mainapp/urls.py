from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),
    path('palette/', views.palette_page, name='palette'),
    path('profile/', views.profile_page, name='profile'),

    path('auth/', views.auth_page, name='auth_page'),
    path('logout/', views.logout_view, name='logout'),
]