from django.contrib import admin
from .models import Palette, Color, ImagePalette, ExtractUsage

admin.site.register(Palette)
admin.site.register(Color)
admin.site.register(ImagePalette)
admin.site.register(ExtractUsage)