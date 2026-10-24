"""Build optimised, responsive web assets from the originals in assets-src/.

Run with:  python -I scripts/build_assets.py   (from the website/ folder)

Outputs WebP variants into public/assets/ and writes src/data/image-manifest.json
(intrinsic sizes for every generated file, so pages can reserve layout space).
Requires Pillow >= 10.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "public" / "assets"
MANIFEST = ROOT / "src" / "data" / "image-manifest.json"

NAVY = (33, 49, 80)
NAVY_DEEP = (9, 14, 26)
GOLD = (200, 165, 90)

HERO_WIDTHS = (960, 1600, 2560, 3840)
PRODUCT_WIDTHS = (240, 480, 960)
CRAFT_WIDTHS = (640, 1200)

manifest: dict[str, dict[str, int]] = {}


def save_webp(img: Image.Image, rel: str, quality: int = 78) -> None:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not FORCE:
        with Image.open(path) as existing:
            manifest[rel] = {"w": existing.width, "h": existing.height}
        return
    img.save(path, "WEBP", quality=quality, method=4)
    manifest[rel] = {"w": img.width, "h": img.height}


def resized(img: Image.Image, width: int) -> Image.Image:
    if img.width <= width:
        return img.copy()
    height = round(img.height * width / img.width)
    return img.resize((width, height), Image.LANCZOS)


# ---------------------------------------------------------------- heroes
def grade_editorial(img: Image.Image) -> Image.Image:
    """Navy duotone-style grade so licensed editorial photos sit with the
    dark, cinematic tenant heroes and incidental third-party marks recede."""
    img = img.convert("RGB")
    lum = ImageOps.grayscale(img)
    lum = ImageEnhance.Contrast(lum).enhance(1.15)
    toned = ImageOps.colorize(lum, black=NAVY_DEEP, white=(236, 230, 214), mid=(78, 92, 120))
    blended = Image.blend(toned, img, 0.22)
    return ImageEnhance.Brightness(blended).enhance(0.82)


def crop_to_ratio(img: Image.Image, ratio: float, focus_y: float = 0.5) -> Image.Image:
    w, h = img.size
    target_h = round(w / ratio)
    if target_h >= h:
        return img
    top = round((h - target_h) * focus_y)
    return img.crop((0, top, w, top + target_h))


def build_heroes() -> None:
    tenant = SRC / "tenant"
    for src in sorted(tenant.glob("hero-4k-*.webp")):
        slug = src.stem.replace("hero-4k-", "")
        with Image.open(src) as img:
            img = img.convert("RGB")
            for w in HERO_WIDTHS:
                save_webp(resized(img, w), f"hero/{slug}-{w}.webp", quality=74)

    # Licensed Unsplash photographs for categories without tenant imagery.
    focus = {"field-hockey": 0.62, "wrestling": 0.55, "kickboxing": 0.4, "martial-arts": 0.45}
    for src in sorted((SRC / "unsplash").glob("*.jpg")):
        slug = src.stem
        with Image.open(src) as img:
            img = crop_to_ratio(grade_editorial(img), 4096 / 1738, focus.get(slug, 0.5))
            for w in HERO_WIDTHS:
                save_webp(resized(img, w), f"hero/{slug}-{w}.webp", quality=74)


# -------------------------------------------------------------- products
def build_products() -> None:
    catalog = json.loads((ROOT / "src" / "data" / "platform-catalog.json").read_text(encoding="utf-8"))
    for cat in catalog["categories"]:
        for product in cat["products"]:
            if not product.get("source"):
                continue
            with Image.open(SRC / "tenant" / product["source"]) as img:
                img = img.convert("RGBA")
                for w in PRODUCT_WIDTHS:
                    save_webp(resized(img, w), f"products/{cat['slug']}/{product['slug']}-{w}.webp", quality=80)


# ----------------------------------------------------------------- craft
CRAFT = {
    # platform starter library (decoration + factory illustration)
    "starter-d-sublimation.webp": "sublimation",
    "starter-d-embroidery.webp": "embroidery",
    "starter-d-screenprint.webp": "screen-print",
    "starter-d-heat.webp": "heat-transfer",
    "starter-d-twill.webp": "tackle-twill",
    "starter-d-woven.webp": "woven-labels",
    "starter-f-cutting.webp": "process-cutting",
    "starter-f-print.webp": "process-printing",
    "starter-f-sewing.webp": "process-sewing",
    "starter-f-qc.webp": "process-quality",
    # tenant streetwear library
    "sw-fab-jersey-heavy.webp": "fabric-heavy-jersey",
    "sw-fab-pique.webp": "fabric-pique",
    "sw-fab-fleece.webp": "fabric-fleece",
    "sw-fab-french-terry.webp": "fabric-french-terry",
    "sw-fab-nylon.webp": "fabric-nylon",
    "sw-fab-twill.webp": "fabric-twill",
    "sw-acc-labels.webp": "trim-labels",
    "sw-acc-hangtags.webp": "trim-hangtags",
    "sw-pack-polybag.webp": "pack-polybag",
    "sw-pack-carton.webp": "pack-carton",
}


def build_craft() -> None:
    for name, slug in CRAFT.items():
        with Image.open(SRC / "tenant" / name) as img:
            img = img.convert("RGB")
            for w in CRAFT_WIDTHS:
                save_webp(resized(img, w), f"craft/{slug}-{w}.webp", quality=76)


# ----------------------------------------------------------------- brand
def extract_on_white(img: Image.Image) -> Image.Image:
    """Turn the navy+gold logo on a white background into a transparent PNG."""
    rgb = img.convert("RGB")
    px = rgb.load()
    out = Image.new("RGBA", rgb.size)
    opx = out.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = px[x, y]
            lo = min(r, g, b)
            is_navy = b >= r
            ink = NAVY if is_navy else GOLD
            ink_lo = min(ink)
            a = max(0.0, min(1.0, (250 - lo) / (250 - ink_lo)))
            if a < 0.04:
                opx[x, y] = (0, 0, 0, 0)
                continue
            # un-premultiply against white
            cr = round(min(255, max(0, (r - 255 * (1 - a)) / a)))
            cg = round(min(255, max(0, (g - 255 * (1 - a)) / a)))
            cb = round(min(255, max(0, (b - 255 * (1 - a)) / a)))
            opx[x, y] = (cr, cg, cb, round(a * 255))
    return out


def recolour_navy_to_white(img: Image.Image) -> Image.Image:
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and b >= r:
                px[x, y] = (255, 255, 255, a)
    return out


def build_brand() -> None:
    brand = OUT / "brand"
    brand.mkdir(parents=True, exist_ok=True)
    with Image.open(SRC / "brand" / "mufasar-logo-color-source.jpg") as src:
        logo = extract_on_white(src)
    full_box = logo.getbbox()
    full = logo.crop(full_box)
    # The shield mark sits above the wordmark; find the first fully empty row band.
    alpha = full.getchannel("A")
    rows = [alpha.crop((0, y, full.width, y + 1)).getextrema()[1] for y in range(full.height)]
    gap = next(y for y in range(int(full.height * 0.35), full.height) if rows[y] < 10)
    mark = full.crop((0, 0, full.width, gap))
    mark = mark.crop(mark.getbbox())

    full.save(brand / "logo-color.png", optimize=True)
    manifest["brand/logo-color.png"] = {"w": full.width, "h": full.height}
    mark_dark = recolour_navy_to_white(mark)
    for name, im in (("mark-color", mark), ("mark-on-dark", mark_dark)):
        sized = resized(im, 256)
        sized.save(brand / f"{name}.png", optimize=True)
        manifest[f"brand/{name}.png"] = {"w": sized.width, "h": sized.height}
    # Header-sized mark (2x of the 40px display width).
    save_webp(resized(mark_dark, 80), "brand/mark-on-dark-80.webp", quality=90)

    with Image.open(SRC / "brand" / "mufasar-logo-white.webp") as white:
        white = white.convert("RGBA")
        white = white.crop(white.getbbox())
        save_webp(resized(white, 560), "brand/logo-white.webp", quality=90)
        # Horizontal lockup pieces: wordmark only (below the shield).
        a = white.getchannel("A")
        rows = [a.crop((0, y, white.width, y + 1)).getextrema()[1] for y in range(white.height)]
        gap = next(y for y in range(int(white.height * 0.45), white.height) if rows[y] < 10)
        word = white.crop((0, gap, white.width, white.height))
        word = word.crop(word.getbbox())
        save_webp(resized(word, 520), "brand/wordmark-white.webp", quality=90)
        save_webp(resized(word, 240), "brand/wordmark-white-240.webp", quality=90)
        save_webp(resized(white, 260), "brand/logo-white-260.webp", quality=90)

    # Favicons / touch icon on brand navy.
    for size, name in ((32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")):
        tile = Image.new("RGBA", (size, size), NAVY_DEEP + (255,))
        m = mark_dark.copy()
        m.thumbnail((round(size * 0.74), round(size * 0.74)), Image.LANCZOS)
        tile.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
        tile.save(OUT.parent / name if name != "icon-512.png" else brand / name, optimize=True)

    # Default Open Graph image (1200x630).
    with Image.open(SRC / "tenant" / "hero-4k-soccer.webp") as hero:
        og = ImageOps.fit(hero.convert("RGB"), (1200, 630), centering=(0.6, 0.5))
    shade = Image.new("L", og.size)
    sd = ImageDraw.Draw(shade)
    for x in range(og.width):
        sd.line([(x, 0), (x, og.height)], fill=max(0, 235 - int(x * 0.32)))
    og = Image.composite(Image.new("RGB", og.size, NAVY_DEEP), og, shade)
    with Image.open(SRC / "brand" / "mufasar-logo-white.webp") as white:
        white = white.convert("RGBA")
        white = white.crop(white.getbbox())
        white.thumbnail((300, 300), Image.LANCZOS)
        og.paste(white, (80, (630 - white.height) // 2), white)
    og.save(OUT / "brand" / "og-default.jpg", quality=86, optimize=True)
    manifest["brand/og-default.jpg"] = {"w": 1200, "h": 630}


# Existing outputs are reused unless --force is passed (WebP encoding is slow).
FORCE = "--force" in sys.argv

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    build_brand()
    build_heroes()
    build_products()
    build_craft()
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=0), encoding="utf-8")
    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"{len(manifest)} assets, {total / 1_048_576:.1f} MB -> {OUT}")
