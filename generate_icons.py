from PIL import Image, ImageDraw, ImageFont

colors = {'bg': '#f1e6d2', 'fg': '#7c581f', 'accent': '#a9793f'}
text = 'CB'

for size, path in [
    (180, 'icons/apple-touch-icon.png'),
    (192, 'icons/icon-192.png'),
    (512, 'icons/icon-512.png'),
]:
    img = Image.new('RGBA', (size, size), colors['bg'])
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('arial.ttf', int(size * 0.35))
    except Exception:
        font = ImageFont.load_default()
    w, h = draw.textsize(text, font=font)
    draw.text(((size - w) / 2, (size - h) / 2), text, font=font, fill=colors['fg'])
    draw.ellipse((size * 0.1, size * 0.1, size * 0.3, size * 0.3), fill=colors['accent'])
    draw.ellipse((size * 0.7, size * 0.7, size * 0.9, size * 0.9), fill=colors['accent'])
    img.save(path)
