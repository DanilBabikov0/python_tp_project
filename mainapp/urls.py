from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='home'),
    path('extract/', views.extract_page, name='image_page'),
    path('auth/', views.auth_page, name='auth_page'),
    path('logout/', views.logout_view, name='logout'),

    path('palette/', views.palette_page, name='palette_page'),
    path('profile/', views.profile_page, name='profile_page'),
    path('image-palettes/', views.image_palettes_view, name='image_palettes'),
]