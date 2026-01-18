from io import BytesIO
from pathlib import Path
import uuid
from PIL import Image, UnidentifiedImageError
import numpy as np
from sklearn.cluster import KMeans
from django.core.files.base import ContentFile

MAX_IMAGE_SIZE = (1000, 1000)

def extract_colors(image_file, count=5):
    """Извлечение цветов из палитры"""
    count = min(max(int(count), 1), 10)
    try:
        image = open_image(image_file)

        if image.width > MAX_IMAGE_SIZE[0] or image.height > MAX_IMAGE_SIZE[1]:
            image.thumbnail(MAX_IMAGE_SIZE)

        image = image_to_RGB(image)
        
        image = image.resize((300, 300))

        np_image = np.array(image)
        np_image = np_image.reshape(-1, 3)
        
        kmeans = KMeans(
            n_clusters=count,
            n_init=10,
            random_state=42
        )
        kmeans.fit(np_image)

        colors = kmeans.cluster_centers_.astype(int)
        hex_colors = [f"#{r:02x}{g:02x}{b:02x}" for r, g, b in colors]
        
        return hex_colors
    except (UnidentifiedImageError, IOError, ValueError) as e:
        raise ValueError(f"Invalid image file: {str(e)}")
    except Exception as e:
        raise ValueError("Failed to process image")


def create_preview(image_file, size=(150, 150)):
    """Создание превью изображения"""
    try:
        image = open_image(image_file)
        
        image = image_to_RGB(image)
        
        image.thumbnail(size)
        
        buffer = BytesIO()
        format = 'PNG' if image.mode == 'RGBA' else 'JPEG'
        image.save(buffer, format=format, quality=85)
        buffer.seek(0)
        
        original_name = Path(image_file.name).stem
        safe_name = f"preview_{original_name[:20]}_{uuid.uuid4().hex}.{format.lower()}"
        
        return ContentFile(buffer.read(), name=safe_name)
    
    except Exception as e:
        raise ValueError(f"Preview creation error: {str(e)}")

def open_image(image_file):
    """Открытыие файла с его проверкой"""
    image = Image.open(image_file)
    image.verify()
    image = Image.open(image_file)

    return image

def image_to_RGB(image):
    """Конвертация изображения"""
    if image.mode == 'RGBA':
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')

    return image