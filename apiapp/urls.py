from django.urls import path
from . import views

urlpatterns = [
    path('palettes/generate/', views.generate_palette_view, name='generate_palette'),
    path('palettes/random/', views.random_palette_view, name='random_palette'),

    path('palettes/<str:username>/', views.get_palettes, name='get_palettes'),
    path('palettes/<str:username>/save/', views.save_palette, name='create_palette'),
    path('palettes/<str:username>/<int:palette_id>/', views.get_palette, name='get_palette'),
    path('palettes/<str:username>/<int:palette_id>/delete/', views.delete_palette, name='delete_palette'),

    path('image/extract/', views.extract_colors_view, name='extract_colors'),
    path('image/<str:username>/', views.get_user_image_palettes, name='get_user_image_palettes'),
    path('image/<str:username>/<int:id>/', views.get_image_palette, name='get_image_palette'),
    path('image/<str:username>/<int:id>/delete/', views.delete_image_palette, name='delete_image_palette'),
    
    path('docx/', views.docx_page, name='docx_page'),
]