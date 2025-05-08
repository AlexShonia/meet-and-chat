import random

def generate_random_color():
    r = random.randint(100, 255)
    g = random.randint(100, 255)
    b = random.randint(100, 255)

    hex_color = f"#{r:02x}{g:02x}{b:02x}"
    return hex_color