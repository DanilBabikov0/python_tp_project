import colorsys
import random
import requests
import webcolors

COLOR_NAME_CACHE = {}

def hex_to_rgb(value):
    """Преобразует hex в rgb"""
    value = value.lstrip('#')

    if len(value) == 3:
        value = ''.join([c*2 for c in value])
    elif len(value) != 6:
        raise ValueError(f"Некорректная длина hex-кода: #{value}")
    
    try:
        return (
            int(value[0:2], 16),
            int(value[2:4], 16),
            int(value[4:6], 16)
        )
    except ValueError:
        raise ValueError(f"Некорректные символы в hex-коде: #{value}")

def rgb_to_hex(rgb):
    """Преобразует rgb в hex"""
    if not (isinstance(rgb, (tuple, list))):
        raise ValueError("Некорректный формат RGB(Не список/кортеж)")
    if len(rgb) != 3:
        raise ValueError("Не полный набор данных")
    
    r, g, b = rgb
    if not all(0 <= x <= 255 for x in (r, g, b)):
        raise ValueError(f"RGB значения должны быть 0-255: {rgb}")
    
    return '#{:02x}{:02x}{:02x}'.format(r, g, b)

def generate_complementary(r, g, b):
    """Генирирует комплементарную палитру"""
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    h_complement = (h + 0.5) % 1.0
    rgb_complement = colorsys.hls_to_rgb(h_complement, l, s)
    r_c, g_c, b_c = [int(c * 255) for c in rgb_complement]
    return [(r, g, b), (r_c, g_c, b_c)]

def generate_analogous(r, g, b):
    """Генирирует аналоговую палитру"""
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    h1 = (h + 0.0833) % 1.0
    h2 = (h - 0.0833) % 1.0
    rgb1 = colorsys.hls_to_rgb(h1, l, s)
    rgb2 = colorsys.hls_to_rgb(h2, l, s)
    return [(r, g, b), tuple(int(c * 255) for c in rgb1), tuple(int(c * 255) for c in rgb2)]

def generate_triadic(r, g, b):
    """Генирирует триадную палитру"""
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    h1 = (h + 0.3333) % 1.0
    h2 = (h + 0.6666) % 1.0
    rgb1 = colorsys.hls_to_rgb(h1, l, s)
    rgb2 = colorsys.hls_to_rgb(h2, l, s)
    return [(r, g, b), tuple(int(c * 255) for c in rgb1), tuple(int(c * 255) for c in rgb2)]

def generate_monochromatic(r, g, b):
    """Генирирует монохромную палитру"""
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    shades = []
    for i in range(5):
        new_l = l + (i - 2) * 0.1
        new_l = max(0, min(1, new_l))
        rgb = colorsys.hls_to_rgb(h, new_l, s)
        shades.append(tuple(int(c * 255) for c in rgb))
    return shades

def generate_random_color():
    """Генирирует случайный rgb цвет"""
    r = random.randint(0, 255)
    g = random.randint(0, 255)
    b = random.randint(0, 255)
    return (r, g, b)


def palette_response(r, g, b):
    """Формурирует ответ по заданному rgb цвету"""
    base = rgb_to_hex((r, g, b))
    return {
        'base_color': f"{base}",
        'analogous': [rgb_to_hex(c) for c in generate_analogous(r, g, b)],
        'complementary': [rgb_to_hex(c) for c in generate_complementary(r, g, b)],
        'triadic': [rgb_to_hex(c) for c in generate_triadic(r, g, b)],
        'monochromatic': [rgb_to_hex(c) for c in generate_monochromatic(r, g, b)],
    }

def get_color_name(hex_code):
    """Получает название цвета"""
    hex_code = hex_code.lower().lstrip('#')
    cache_key = f'#{hex_code}'

    if cache_key in COLOR_NAME_CACHE:
        return COLOR_NAME_CACHE[cache_key]
    
    name = None
    try:
        name = webcolors.hex_to_name(f'#{hex_code}')
        COLOR_NAME_CACHE[cache_key] = name
    except:
        pass
    
    if not name:
        try:
            url = f"https://www.thecolorapi.com/id?hex={hex_code}"
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                name = data.get('name', {}).get('value', '')
                COLOR_NAME_CACHE[cache_key] = name
        except:
            name = cache_key
    return name