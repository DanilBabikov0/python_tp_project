from django.db import models
from django.contrib.auth.models import User

class Palette(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} {self.owner.username}"

class Color(models.Model):
    hex_code = models.CharField(max_length=7)  # например, #FF5733
    palette = models.ForeignKey(Palette, on_delete=models.CASCADE, related_name='colors')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.hex_code