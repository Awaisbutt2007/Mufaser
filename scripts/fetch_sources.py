"""Re-download the original image sources into assets-src/ (git-ignored).

Only needed to regenerate public/assets with build_assets.py; the optimised
outputs are committed, so a normal build does not need this.

    python -I scripts/fetch_sources.py

Sources (see src/data/asset-sources.ts for licences):
  * Mufasar tenant media + platform starter library, via the public site.
  * Four Unsplash photographs (Unsplash License).
The client logo (assets-src/brand/mufasar-logo-color-source.jpg) was supplied
directly by the client and must be copied in by hand.
"""
from __future__ import annotations

import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
HOST = "https://mufasar-enterprises.sialkotb2b.com"

UNSPLASH = {
    "field-hockey": "photo-1734159319354-b9ead78dd441",
    "wrestling": "photo-1541337082051-5959dbb57d5d",
    "kickboxing": "photo-1620123646588-b9117246a9d0",
    "martial-arts": "photo-1656653121475-e33829581294",
}


def fetch(url: str, dest: Path) -> None:
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "mufasar-asset-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=90) as res:
        dest.write_bytes(res.read())
    print("fetched", dest.relative_to(ROOT))


def jobs():
    for line in (SRC / "tenant-media-keys.txt").read_text().splitlines():
        key = line.strip().rstrip("\\")
        if key.startswith("sites/"):
            name = Path(key).name
            folder = "brand" if name.startswith("mufasar-logo") else "tenant"
            yield f"{HOST}/api/media?host={urllib.parse.quote(HOST[8:])}&key={urllib.parse.quote(key, safe='')}", SRC / folder / name
        elif key.startswith("/tenants/"):
            yield HOST + key, SRC / "tenant" / f"starter-{Path(key).name}"
    for name, photo in UNSPLASH.items():
        yield f"https://images.unsplash.com/{photo}?w=3840&q=85&fm=jpg", SRC / "unsplash" / f"{name}.jpg"


if __name__ == "__main__":
    with ThreadPoolExecutor(8) as pool:
        list(pool.map(lambda j: fetch(*j), jobs()))
