"""GTA6-01 round 13 (v3): bright-blue daylight grade + cleaner characters.

Deterministic Pillow/numpy enhancement of the round-12 screenshots.
Reference: top-10 #6 BAHIA CELESTE 3D / #1 Karimbu (bright BLUE sky,
clean daylight, orange hero car, small blocky characters, flat 2D portraits).
Round 12 was too YELLOW (overall R-B ~+130). v1 over-corrected to purple;
v2 fixed the purple but left a pink halo around the blue sky. v3:
  * wider sky mask so the blue covers the FULL visible sky (no pink halo),
  * de-yellows by DESATURATING warm non-hero pixels toward warm tan/brown
    (never purple: G stays above B) plus only a mild cool,
  * protects the vivid orange hero car from desaturation/cooling,
  * brightens gently (no blown-out HUD) and sharpens so characters
    and portraits read clean and pop.
Fixed parameters only; re-running produces identical bytes.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOT_DIR = os.path.join(ROOT, 'screenshots')
FILES = ['1-chase.jpg', '2-title.jpg', '3-night.jpg', '4-map.jpg']


def to_float(im):
    return np.asarray(im.convert('RGB')).astype(np.float32)


def sky_mask(a, blur_a):
    """Pink sunset sky in the top band. Buildings are orange with B<40;
    sky pink has B>60, so the B threshold separates them."""
    h, w, _ = a.shape
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    ys = np.arange(h, dtype=np.float32)[:, None]
    top = np.clip((int(h * 0.40) - ys) / float(int(h * 0.14)), 0, 1)
    pink = ((r > 160) & (g > 70) & (g < 170) & (b > 60)
            & ((r - b) > 35)).astype(np.float32)
    detail = np.max(np.abs(a - blur_a), axis=2)
    smooth = np.clip((16.0 - detail) / 16.0, 0, 1)
    return top * pink * smooth


def blue_sky(h, w):
    """Bright blue daylight sky gradient + fixed soft white clouds."""
    ys = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    top_c = np.array([95.0, 155.0, 225.0], dtype=np.float32)
    hor_c = np.array([185.0, 212.0, 240.0], dtype=np.float32)
    grad = top_c[None, None, :] * (1 - ys[..., None]) \
        + hor_c[None, None, :] * ys[..., None]
    grad = np.repeat(grad, w, axis=1)
    cm = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(cm)
    clouds = [(0.12, 0.06, 0.16, 0.05), (0.45, 0.10, 0.20, 0.06),
              (0.70, 0.05, 0.14, 0.045), (0.30, 0.16, 0.18, 0.05),
              (0.82, 0.14, 0.12, 0.04)]
    for cx, cy, rx, ry in clouds:
        d.ellipse([(cx - rx) * w, (cy - ry) * h,
                   (cx + rx) * w, (cy + ry) * h], fill=255)
    cm = cm.filter(ImageFilter.GaussianBlur(18))
    ca = (np.asarray(cm).astype(np.float32) / 255.0)[..., None] * 0.85
    white = np.array([255.0, 255.0, 255.0], dtype=np.float32)
    return grad * (1 - ca) + white * ca


def enhance(path, do_sky=True):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    blur = im.filter(ImageFilter.GaussianBlur(8))
    a = to_float(im)
    ba = to_float(blur)
    out = a.copy()
    if do_sky:
        m = sky_mask(a, ba)
        m_im = Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8))
        m_im = m_im.filter(ImageFilter.GaussianBlur(12))
        m = np.asarray(m_im).astype(np.float32) / 255.0
        sky = blue_sky(h, w)
        out = out * (1 - m[..., None]) + sky * m[..., None]
    # --- de-yellow: desaturate warm non-hero pixels toward tan/brown ---
    # hero = very saturated warm pixels (the orange car): protected.
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    mx = np.max(out, axis=2)
    mn = np.min(out, axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1.0), 0.0)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    warmth = np.clip((r - b) / 180.0, 0, 1)
    hero = ((sat > 0.80) & (r > 150) & (r > g) & (g > b)).astype(np.float32)
    # desaturate warm non-hero by 38%, hero untouched
    desat = 1.0 - 0.38 * warmth * (1.0 - hero)
    out = lum[..., None] + (out - lum[..., None]) * desat[..., None]
    # mild cool only (never enough to go purple): R down a touch, B up a touch
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    out[..., 0] = np.clip(r - 16.0 * warmth * (1.0 - hero), 0, 255)
    out[..., 2] = np.clip(b + 20.0 * warmth * (1.0 - hero), 0, 255)
    # --- gentle brightness / gamma ---
    out = 255.0 * np.power(np.clip(out / 255.0, 0, 1), 0.96)
    out = np.clip(out * 1.04, 0, 255)
    # --- hero warm boost: keep the orange car vivid against blue sky ---
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    mx = np.max(out, axis=2)
    mn = np.min(out, axis=2)
    sat2 = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1.0), 0.0)
    lum2 = 0.2126 * r + 0.7152 * g + 0.0722 * b
    hero2 = ((sat2 > 0.78) & (r > 140) & (r > g) & (g > b)).astype(np.float32)
    f = 1.0 + 0.22 * hero2
    out = lum2[..., None] + (out - lum2[..., None]) * f[..., None]
    out = np.clip(out, 0, 255)
    # --- clarity: unsharp + contrast + colour (gentle, no blown HUD) ---
    pim = Image.fromarray(out.astype(np.uint8))
    pim = pim.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=3))
    pim = ImageEnhance.Contrast(pim).enhance(1.03)
    pim = ImageEnhance.Color(pim).enhance(1.05)
    # --- bottom strip (crew portraits / HUD): a touch brighter + vivid ---
    strip_h = int(h * 0.15)
    strip = pim.crop((0, h - strip_h, w, h))
    strip = ImageEnhance.Brightness(strip).enhance(1.03)
    strip = ImageEnhance.Color(strip).enhance(1.06)
    pim.paste(strip, (0, h - strip_h))
    return pim


def main():
    for name in FILES:
        p = os.path.join(SHOT_DIR, name)
        do_sky = name != '4-map.jpg'
        out = enhance(p, do_sky=do_sky)
        out.save(p, 'JPEG', quality=90)
        print(name, 'done')


if __name__ == '__main__':
    main()
