from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apiapp.models import Color, Palette, ImagePalette

from .color_utils import *
from .image_utils import extract_colors, create_preview

# PAGE
def docx_page(request):
    return render(request, 'docx.html')

# GENERATE
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

# USER
User = get_user_model()

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
    
    if request.user.username != username:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    try:
        palette = Palette.objects.get(id=palette_id, owner=request.user)
    except Palette.DoesNotExist:
        return JsonResponse({'error': 'Palette not found'}, status=404)
    
    palette.delete()
    return JsonResponse({'success': True, 'message': 'Палитра удалена'})


# image
@csrf_exempt
@require_http_methods(["POST"])
def extract_colors_view(request):
    try:
        if 'image' not in request.FILES:
            return JsonResponse({"error": "Image file is required"}, status=400)
        
        image_file = request.FILES['image']
        
        count = request.POST.get('count', '5')
        try:
            count = int(count)
            if count < 1 or count > 20:
                count = 5
        except (ValueError, TypeError):
            count = 5
        
        hex_colors = extract_colors(image_file, count)
        
        preview_file = create_preview(image_file)
        
        palette = None
        if request.user.is_authenticated:
            palette = ImagePalette.objects.create(
                image_name=image_file.name,
                preview=preview_file,
                colors=hex_colors,
                owner=request.user
            )
        
        response_data = {
            "colors": hex_colors,
            "count": count,
            "filename": image_file.name
        }
        
        if palette:
            response_data.update({
                "palette_id": palette.id,
                "created_at": palette.created_at.isoformat()
            })
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({
            "error": f"Failed to extract colors: {str(e)}",
            "error_type": type(e).__name__
        }, status=500)
    

@api_view(['GET'])
def get_user_image_palettes(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    palettes = ImagePalette.objects.filter(owner=user)
    result = []
    for p in palettes:
        result.append({
            'id': p.id,
            'image_name': p.image_name,
            'preview': p.preview.url if p.preview else None,
            'colors': p.colors,
            'created_at': p.created_at.isoformat()
        })
    return Response(result)

@api_view(['GET'])
def get_image_palette(request, username, id):
    try:
        user = User.objects.get(username=username)
        palette = ImagePalette.objects.get(id=id, owner=user)
    except ImagePalette.DoesNotExist:
        return Response({'error': 'Palette not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': palette.id,
        'image_name': palette.image_name,
        'preview': palette.preview.url if palette.preview else None,
        'colors': palette.colors,
        'created_at': palette.created_at.isoformat()
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_image_palette(request, username, id):
    try:
        user = User.objects.get(username=username)
        palette = ImagePalette.objects.get(id=id, owner=user)
    except ImagePalette.DoesNotExist:
        return Response({'error': 'Palette not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user != palette.owner:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    palette.delete()
    return Response({'success': True})