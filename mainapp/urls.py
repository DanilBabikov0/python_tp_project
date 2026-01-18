from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='home'),
    path('extract/', views.extract_page, name='image_page'),
    path('auth/', views.auth_page, name='auth_page'),
    path('logout/', views.logout_view, name='logout'),
]