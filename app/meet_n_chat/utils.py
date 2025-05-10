import random


def generate_random_color():
    r = random.randint(100, 255)
    g = random.randint(100, 255)
    b = random.randint(100, 255)

    hex_color = f"#{r:02x}{g:02x}{b:02x}"
    return hex_color


def pick_random_color():
    return complementary_colors[random.randint(0, len(complementary_colors) - 1)]


complementary_colors = [
    "#FF6B6B",
    "#FFB86C",
    "#FAD02E",
    "#7CFB7C",
    "#50FA7B",
    "#00FFAE",
    "#8BE9FD",
    "#00D2FF",
    "#2E64FA",
    "#A78BFA",
    "#B57CFB",
    "#FF79C6",
    "#FF69B4",
    "#FF5555",
    "#F8C291",
    "#FF9FF3",
    "#6C5CE7",
    "#341f97",
    "#48dbfb",
    "#1dd1a1",
    "#feca57",
    "#ff6b81",
    "#ee5253",
    "#5f27cd",
    "#54a0ff",
    "#00cec9",
    "#fab1a0",
    "#ffeaa7",
    "#a29bfe",
    "#fd79a8",
    "#e17055",
    "#00b894",
    "#0984e3",
    "#6ab04c",
    "#c44569",
]
