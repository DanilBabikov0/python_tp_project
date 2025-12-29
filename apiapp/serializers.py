from rest_framework import serializers
from .models import Palette, Color

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['hex_code']

class PaletteSerializer(serializers.ModelSerializer):
    colors = ColorSerializer(many=True, read_only=True)

    class Meta:
        model = Palette
        fields = ['id', 'name', 'colors']