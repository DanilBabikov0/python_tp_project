from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def home(request):
    return render(request, 'home.html')

def auth_page(request):
    return render(request, 'auth.html')

@login_required
def profile(request):
    user = request.user
    context = {
        'name': user.get_full_name() or user.username,
        'avatar': user.socialaccount_set.first().get_avatar_url() if user.socialaccount_set.exists() else None
    }
    return render(request, 'profile.html', context)