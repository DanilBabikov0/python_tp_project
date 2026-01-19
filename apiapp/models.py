from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import os

class Palette(models.Model):
    """Модель пользовательских палитр цветов"""
    id = models.AutoField(
        primary_key=True, 
        verbose_name="ID"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Название палитры"
    )
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        blank=True,
        null=True,
        verbose_name="Владелец"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    def __str__(self):
        return f"{self.name} (Владелец: {self.owner.username})"
    
    class Meta:
        verbose_name = "Palette"


class Color(models.Model):
    """Модель цвета в палитре"""
    hex_code = models.CharField(
        max_length=7,
        verbose_name="Hex-код"
    )
    palette = models.ForeignKey(
        Palette, 
        on_delete=models.CASCADE, 
        related_name='colors',
        verbose_name="Палитра"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    def __str__(self):
        return f"{self.hex_code}"
    
    class Meta:
        verbose_name = "Color"


class ImagePalette(models.Model):
    """Модель палитры, извлеченной из изображения"""
    id = models.AutoField(
        primary_key=True,
        verbose_name="ID"
    )
    image_name = models.CharField(
        max_length=100,
        verbose_name="Название изображения"
    )
    preview = models.ImageField(
        upload_to='', 
        blank=True, 
        null=True,
        verbose_name="Превью"
    )
    colors = models.JSONField(
        verbose_name="Извлеченные цвета"
    )
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        verbose_name="Владелец"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    def __str__(self):
        return f"{self.image_name} (Владелец: {self.owner.username})"
    
    def delete(self, *args, **kwargs):
        if self.preview:
            if os.path.isfile(self.preview.path):
                os.remove(self.preview.path)
        super().delete(*args, **kwargs)

    class Meta:
        verbose_name = "ImagePalette"


class ExtractUsage(models.Model):
    """Модель для отслеживания лимитов использования функции извлечения цветов"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        verbose_name="Пользователь"
    )
    last_used = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Последнее использование"
    ) 
    count = models.IntegerField(
        default=0,
        verbose_name="Счетчик использований"
    )

    def __str__(self):
        return f"{self.user.username} - {self.last_used}: {self.count}"
    
    class Meta:
        verbose_name = "Limit"