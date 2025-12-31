import colorsys
import random

def hex_to_rgb(value):
    value = value.lstrip('#')
    lv = len(value)
    return tuple(int(value[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))

def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % rgb

def generate_complementary(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    h_complement = (h + 0.5) % 1.0
    rgb_complement = colorsys.hls_to_rgb(h_complement, l, s)
    r_c, g_c, b_c = [int(c * 255) for c in rgb_complement]
    return [(r, g, b), (r_c, g_c, b_c)]

def generate_analogous(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    h1 = (h + 0.0833) % 1.0
    h2 = (h - 0.0833) % 1.0
    rgb1 = colorsys.hls_to_rgb(h1, l, s)
    rgb2 = colorsys.hls_to_rgb(h2, l, s)
    return [(r, g, b), tuple(int(c * 255) for c in rgb1), tuple(int(c * 255) for c in rgb2)]

def generate_triadic(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    h1 = (h + 0.3333) % 1.0
    h2 = (h + 0.6666) % 1.0
    rgb1 = colorsys.hls_to_rgb(h1, l, s)
    rgb2 = colorsys.hls_to_rgb(h2, l, s)
    return [(r, g, b), tuple(int(c * 255) for c in rgb1), tuple(int(c * 255) for c in rgb2)]

def generate_monochromatic(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    shades = []
    for i in range(5):
        new_l = l + (i - 2) * 0.1
        new_l = max(0, min(1, new_l))
        rgb = colorsys.hls_to_rgb(h, new_l, s)
        shades.append(tuple(int(c * 255) for c in rgb))
    return shades

def generate_random_color():
    r = random.randint(0, 255)
    g = random.randint(0, 255)
    b = random.randint(0, 255)
    return (r, g, b)


def palette_response(r, g, b):
    base = rgb_to_hex((r, g, b))
    return {
        'base_color': f"{base}",
        'analogous': [rgb_to_hex(c) for c in generate_analogous(r, g, b)],
        'complementary': [rgb_to_hex(c) for c in generate_complementary(r, g, b)],
        'triadic': [rgb_to_hex(c) for c in generate_triadic(r, g, b)],
        'monochromatic': [rgb_to_hex(c) for c in generate_monochromatic(r, g, b)],
    }