from django.urls import path
from . import views

urlpatterns = [
    path('palettes/generate/', views.generate_palette_view, name='generate_palette'),
    path('palettes/random/', views.random_palette_view, name='random_palette'),
    
    path('docx/', views.docx, name='docx_page'),
]