from django.contrib.auth import get_user_model
from django.shortcuts import render
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apiapp.models import Color, Palette, ImagePalette, ExtractUsage

from apiapp.color_utils import hex_to_rgb, palette_response, generate_random_color, get_color_name
from apiapp.image_utils import extract_colors, create_preview
from datetime import timedelta

# GENERATE
@api_view(['GET'])
def generate_palette_view(request):
    base = request.GET.get('base')

    if not base:
        return Response({'error': 'Base are required'}, status=status.HTTP_400_BAD_REQUEST)
    if base.startswith('#'):
        base = base[1:]
    if len(base) != 6:
        return Response({'error': 'Color must be in format #FFFFFF'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        r, g, b = hex_to_rgb(base)
    except ValueError:
        return Response({'error': 'Invalid hex color'}, status=status.HTTP_400_BAD_REQUEST)

    result = palette_response(r, g, b)

    return Response(result)

@api_view(['GET'])
def random_palette_view(request):
    r, g, b = generate_random_color()
    result = palette_response(r, g, b)

    return Response(result)

@api_view(['GET'])
def get_color_name_view(request):
    hex_code = request.GET.get('color')
    name = get_color_name(hex_code)

    return Response(name)

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
            'id': p.id,
            'name': p.name,
            'colors': color_list
        })
    return Response(result)

@api_view(['GET'])
def get_palette(request, username, palette_id):
    try:
        user = User.objects.get(username=username)
        palette = Palette.objects.get(id=palette_id, owner=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Palette.DoesNotExist:
        return Response({'error': 'Palette not found'}, status=status.HTTP_404_NOT_FOUND)

    color_list = [c.hex_code for c in palette.colors.all()]
    return Response({
        'id': palette.id,
        'name': palette.name,
        'colors': color_list
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_palette(request, username):
    if request.user.username != username:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name', 'palette')
    colors = request.data.get('colors', [])

    if not name:
        return Response({'error': 'Name are required'}, status=status.HTTP_400_BAD_REQUEST)
    if not colors:
        return Response({'error': 'Colors are required'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(colors, list):
        return Response({'error': 'Colors must be a list'}, status=status.HTTP_400_BAD_REQUEST)
    
    palette = Palette.objects.create(name=name, owner=request.user)

    for color in colors:
        Color.objects.create(palette=palette, hex_code=color)

    return Response({
        'id': palette.id,
        'name': palette.name,
        'colors': colors
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_palette(request, username, palette_id):
    if request.user.username != username:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        palette = Palette.objects.get(id=palette_id, owner=request.user)
    except Palette.DoesNotExist:
        return Response({'error': 'Palette not found'}, status=status.HTTP_404_NOT_FOUND)
    
    palette.delete()
    return Response({'success': True})


# IMAGE
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extract_colors_view(request):
    extract_minutes = 60
    now = timezone.now()
    timed = now - timedelta(minutes=extract_minutes)

    ExtractUsage.objects.filter(last_used__lt=timed).delete()

    try:
        usage = ExtractUsage.objects.get(
            user=request.user,
            last_used__gte=timed
        )
    except ExtractUsage.DoesNotExist:
        usage = ExtractUsage.objects.create(
            user=request.user,
            count=0
        )

    if usage.count >= 10:
        return Response({"error": f"Limit exceeded (10 extracts per {extract_minutes} minutes)"}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    try:
        if 'image' not in request.FILES:
            return Response({"error": "Image file is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        count = request.POST.get('count', '5')
        try:
            count = int(count)
            if count < 1 or count > 10:
                count = 5
        except (ValueError, TypeError):
            count = 5
        
        hex_colors = extract_colors(image_file, count)
        
        preview_file = create_preview(image_file)

        palette = None
        existing_palette = ImagePalette.objects.filter(
            owner=request.user,
            colors=hex_colors
        ).first()
        
        if existing_palette:
            palette = existing_palette
        else:
            palette = ImagePalette.objects.create(
                image_name=image_file.name,
                preview=preview_file,
                colors=hex_colors,
                owner=request.user
            )
        
        usage.count += 1
        usage.save()
        
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
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
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