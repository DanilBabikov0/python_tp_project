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

def logout_view(request):
    logout(request)
    return redirect('/')