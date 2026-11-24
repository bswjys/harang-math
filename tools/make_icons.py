#!/usr/bin/env python3
"""공부하랑핑 앱 아이콘 생성 (핑크 하트 + 감)"""
from PIL import Image, ImageDraw, ImageFilter
import math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
os.makedirs(OUT, exist_ok=True)
S = 1024


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def heart_points(cx, cy, size, n=240):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * size / 16.0, cy - y * size / 16.0))
    return pts


def make_icon(scale=1.0, rounded=True):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    # 그라데이션 배경
    top, bot = (255, 190, 224), (247, 96, 168)
    grad = Image.new('RGB', (1, S))
    for y in range(S):
        grad.putpixel((0, y), lerp(top, bot, y / (S - 1)))
    grad = grad.resize((S, S))
    mask = Image.new('L', (S, S), 0)
    mdraw = ImageDraw.Draw(mask)
    if rounded:
        mdraw.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
    else:
        mdraw.rectangle([0, 0, S, S], fill=255)
    img.paste(grad, (0, 0), mask)

    draw = ImageDraw.Draw(img, 'RGBA')
    c = S / 2
    sc = scale

    # 배경 반짝이
    for (dx, dy, r, a) in [(-0.34, -0.32, 0.05, 200), (0.36, -0.26, 0.035, 170),
                           (-0.39, 0.24, 0.03, 150), (0.4, 0.34, 0.045, 180),
                           (0.02, -0.4, 0.022, 150), (-0.05, 0.42, 0.02, 140)]:
        x, y = c + dx * S * sc, c + dy * S * sc
        rr = r * S * sc
        draw.regular_polygon((x, y, rr), 4, rotation=45, fill=(255, 255, 255, a))

    # 흰 하트 (그림자)
    hp = [(x, y) for (x, y) in heart_points(c, c - S * 0.02 * sc, S * 0.40 * sc)]
    shadow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.polygon([(x, y + S * 0.025) for (x, y) in hp], fill=(196, 40, 110, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(S * 0.018))
    img.alpha_composite(shadow)

    draw.polygon(hp, fill=(255, 255, 255, 255))
    # 하트 안쪽 핑크 광택
    gloss = [(x, y) for (x, y) in heart_points(c - S * 0.10 * sc, c - S * 0.11 * sc, S * 0.10 * sc)]
    draw.polygon(gloss, fill=(255, 214, 236, 200))

    # 감 (오른쪽 아래)
    ox, oy = c + S * 0.235 * sc, c + S * 0.245 * sc
    orad = S * 0.115 * sc
    draw.ellipse([ox - orad, oy - orad, ox + orad, oy + orad], fill=(255, 158, 47, 255),
                 outline=(255, 255, 255, 255), width=int(S * 0.012 * sc))
    draw.ellipse([ox - orad * 0.45, oy - orad * 0.6, ox - orad * 0.02, oy - orad * 0.15],
                 fill=(255, 214, 150, 230))
    # 잎
    draw.ellipse([ox - S * 0.006 * sc, oy - orad - S * 0.048 * sc,
                  ox + S * 0.062 * sc, oy - orad + S * 0.002 * sc],
                 fill=(96, 190, 110, 255))
    # 꼭지
    draw.line([ox, oy - orad, ox + S * 0.008 * sc, oy - orad - S * 0.03 * sc],
              fill=(122, 78, 40, 255), width=int(S * 0.012 * sc))

    # 반짝 하트 두 개
    for (dx, dy, sz, col) in [(-0.3, 0.3, 0.05, (255, 255, 255, 210)), (0.3, -0.31, 0.042, (255, 245, 252, 220))]:
        p = heart_points(c + dx * S * sc, c + dy * S * sc, sz * S * sc)
        draw.polygon(p, fill=col)

    return img


def save(img, name, size):
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name))
    print('saved', name, size)


base = make_icon(1.0, rounded=True)
save(base, 'icon-512.png', 512)
save(base, 'icon-192.png', 192)
save(base, 'icon-180.png', 180)
save(base, 'icon-1024.png', 1024)

maskable = make_icon(0.82, rounded=False)
save(maskable, 'icon-512-maskable.png', 512)

# 미리보기
prev = Image.new('RGB', (420, 220), (255, 245, 250))
prev.paste(base.resize((180, 180), Image.LANCZOS), (20, 20), base.resize((180, 180), Image.LANCZOS))
prev.paste(maskable.resize((180, 180), Image.LANCZOS), (220, 20), maskable.resize((180, 180), Image.LANCZOS))
prev.save(os.path.join(OUT, 'icon_preview.png'))
print('done')
