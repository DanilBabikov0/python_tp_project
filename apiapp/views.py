from rest_framework.decorators import api_view
from rest_framework.response import Response
from .color_utils import generate_palette, generate_random_palette
from django.shortcuts import render

def docx(request):
    return render(request, 'docx.html')

@api_view(['GET'])
def generate_palette_view(request):
    base = request.GET.get('base', 'FF5733')
    count = int(request.GET.get('count', 5))
    palette_type = request.GET.get('type', 'analogous')

    colors = generate_palette(base_color=base, count=count, palette_type=palette_type)
    return Response({'colors': colors})

@api_view(['GET'])
def random_palette_view(request):
    count = int(request.GET.get('count', 5))
    colors = generate_random_palette(count=count)
    return Response({'colors': colors})