from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import os

class Palette(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} {self.owner.username}"

class Color(models.Model):
    hex_code = models.CharField(max_length=7)
    palette = models.ForeignKey(Palette, on_delete=models.CASCADE, related_name='colors')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.hex_code
    
class ImagePalette(models.Model):
    id = models.AutoField(primary_key=True)
    image_name = models.CharField(max_length=100)
    preview = models.ImageField(upload_to='', blank=True, null=True)
    colors = models.JSONField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.image_name} ({self.owner.username})"
    
    def delete(self, *args, **kwargs):
        if self.preview:
            if os.path.isfile(self.preview.path):
                os.remove(self.preview.path)
        super().delete(*args, **kwargs)
