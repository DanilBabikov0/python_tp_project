from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from apiapp.models import Color, Palette
from .color_utils import *
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json

def docx(request):
    return render(request, 'docx.html')

User = get_user_model()

# generate
@api_view(['GET'])
def generate_palette_view(request):
    base = request.GET.get('base', 'FF5733')
    if base.startswith('#'):
        base = base[1:]

    r, g, b = hex_to_rgb(base)

    result = {
        'base_color': f"#{base}",
        'analogous': [rgb_to_hex(c) for c in generate_analogous(r, g, b)],
        'complementary': [rgb_to_hex(c) for c in generate_complementary(r, g, b)],
        'triadic': [rgb_to_hex(c) for c in generate_triadic(r, g, b)],
        'monochromatic': [rgb_to_hex(c) for c in generate_monochromatic(r, g, b)],
    }

    return Response(result)

@api_view(['GET'])
def random_palette_view(request):
    r, g, b = generate_random_color()
    base = rgb_to_hex((r, g, b))

    result = {
        'base_color': f"#{base}",
        'analogous': [rgb_to_hex(c) for c in generate_analogous(r, g, b)],
        'complementary': [rgb_to_hex(c) for c in generate_complementary(r, g, b)],
        'triadic': [rgb_to_hex(c) for c in generate_triadic(r, g, b)],
        'monochromatic': [rgb_to_hex(c) for c in generate_monochromatic(r, g, b)],
    }

    return Response(result)

# user
@api_view(['GET'])
def get_palettes(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    palettes = Palette.objects.filter(owner=user)
    result = []
    for p in palettes:
        color_list = [c.hex_code for c in p.colors.all()]
        result.append({
            'id': str(p.id),
            'name': p.name,
            'colors': color_list
        })
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_palette(request, username):
    if request.user.username != username:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name')
    colors = request.data.get('colors', [])

    if not name or not colors:
        return Response({'error': 'Name and colors are required'}, status=status.HTTP_400_BAD_REQUEST)

    palette = Palette.objects.create(name=name, owner=request.user)

    for color in colors:
        Color.objects.create(palette=palette, hex_code=color)

    return Response({
        'id': str(palette.id),
        'name': palette.name,
        'colors': colors
    })

@api_view(['GET'])
def get_palette(request, username, palette_id):
    try:
        user = User.objects.get(username=username)
        palette = Palette.objects.get(id=palette_id, owner=user)
    except Palette.DoesNotExist:
        return Response({'error': 'Palette not found'}, status=status.HTTP_404_NOT_FOUND)

    color_list = [c.hex_code for c in palette.colors.all()]
    return Response({
        'id': str(palette.id),
        'name': palette.name,
        'colors': color_list
    })

@csrf_exempt
@login_required
def delete_palette(request, username, palette_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    # Проверяем, что пользователь удаляет свою палитру
    if request.user.username != username:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    try:
        palette = Palette.objects.get(id=palette_id, owner=request.user)
    except Palette.DoesNotExist:
        return JsonResponse({'error': 'Palette not found'}, status=404)
    
    palette.delete()
    return JsonResponse({'success': True, 'message': 'Палитра удалена'})