from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('mainapp.urls')),
    path('api/', include('apiapp.urls')),

    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
]