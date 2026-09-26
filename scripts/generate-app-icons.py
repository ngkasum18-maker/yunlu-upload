#!/usr/bin/env python3
"""Scale the existing Yunlu icon to App Store sizes."""
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow is required: pip install pillow")

src = Path("public/icons/icon-512.png")
if not src.exists():
    raise SystemExit(f"missing {src}")

img = Image.open(src).convert("RGBA")
canvas = Image.new("RGB", img.size, (21, 32, 24))
canvas.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)

sizes = {
    "store/app-store/icons/AppIcon-1024.png": 1024,
    "public/icons/icon-1024.png": 1024,
    "public/icons/icon-180.png": 180,
    "public/icons/icon-192.png": 192,
    "public/icons/icon-512.png": 512,
}

for dest, size in sizes.items():
    path = Path(dest)
    path.parent.mkdir(parents=True, exist_ok=True)
    out = canvas.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, "PNG")
    print(f"wrote {path} ({size}x{size})")
