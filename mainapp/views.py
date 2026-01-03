from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from apiapp.models import Palette
from django.shortcuts import redirect
from django.contrib.auth import logout

# PAGE
def auth_page(request):
    return render(request, 'auth.html')

def main_page(request):
    return render(request, 'main.html')

@login_required
def extract_page(request):
    return render(request, 'extract.html')

def custom_404_page(request, exception):
    return render(request, '404.html', status=404)

# AUTH
def logout_view(request):
    logout(request)
    return redirect('/')

# TESTING
def palette_page(request):
    return render(request, 'palette.html')

@login_required
def profile_page(request):
    user = request.user
    palettes = Palette.objects.filter(owner=user)

    context = {
        'name': user.get_full_name() or user.username,
        'avatar': user.socialaccount_set.first().get_avatar_url() if user.socialaccount_set.exists() else None,
        'palettes': palettes
    }
    return render(request, 'profile.html', context)

@login_required
def image_palettes_view(request):
    return render(request, 'image_palettes.html')
