from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import handler404
from mainapp.views import custom_404_page
from django.views.static import serve

urlpatterns = [
    path('', include('mainapp.urls')),
    path('api/', include('apiapp.urls')),

    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
]

handler404 = 'mainapp.views.custom_404_page'

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if not settings.DEBUG:
    urlpatterns += [
        path('previews/<path:path>', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]