from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),
    path('palette/', views.palette_page, name='palette_page'),
    path('profile/', views.profile_page, name='profile_page'),
    path('image/', views.image_upload_page, name='image_page'),
    path('image-palettes/', views.image_palettes_view, name='image_palettes'),
    
    path('auth/', views.auth_page, name='auth_page'),
    path('logout/', views.logout_view, name='logout'),
]