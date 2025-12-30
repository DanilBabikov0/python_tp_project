from io import BytesIO
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans
from django.core.files.base import ContentFile

def extract_colors(image_file, count=5):
    image = Image.open(image_file)
    image = image.convert('RGB')

    image = image.resize((150, 150))

    np_image = np.array(image)
    np_image = np_image.reshape((np_image.shape[0] * np_image.shape[1], 3))

    kmeans = KMeans(n_clusters=count)
    kmeans.fit(np_image)

    colors = kmeans.cluster_centers_.astype(int)

    hex_colors = [f"#{int(r):02x}{int(g):02x}{int(b):02x}" for r, g, b in colors]

    return hex_colors

def create_preview(image_file, size=(150, 150)):
    image = Image.open(image_file)
    image = image.convert('RGB')
    image.thumbnail(size)
    
    buffer = BytesIO()
    image.save(buffer, format='JPEG')
    buffer.seek(0)
    
    preview_file = ContentFile(buffer.read(), name=f"preview_{image_file.name}")
    return preview_file