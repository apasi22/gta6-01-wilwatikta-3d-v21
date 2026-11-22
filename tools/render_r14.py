#!/usr/bin/env python3
"""R14: re-render the 4 GTA screenshots from the live game (bright blue daytime).

Uses the Playwright-bundled chrome-headless-shell + SwiftShader WebGL against a
local HTTP server (ES modules need http, not file://). Captures each shot at
1280x720, converts to JPEG, writes screenshots/1-chase.jpg etc.

Usage: python3 tools/render_r14.py   (run from the repo root)
Requires: http server on :8123 serving game/ (python3 -m http.server 8123).
"""
import hashlib
import subprocess
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
GAME = REPO / "game"
OUT = REPO / "screenshots"
CHROME = (
    "/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/"
    "chrome-headless-shell-linux64/chrome-headless-shell"
)
BASE = "http://localhost:8123/index.html"

SHOTS = [
    ("chase", "1-chase.jpg"),
    ("title", "2-title.jpg"),
    ("night", "3-night.jpg"),
    ("map", "4-map.jpg"),
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    OUT.mkdir(exist_ok=True)
    for shot, name in SHOTS:
        png = Path(f"/tmp/r14-{shot}.png")
        cmd = [
            CHROME,
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            "--window-size=1280,720",
            "--virtual-time-budget=9000",
            f"--screenshot={png}",
            f"{BASE}?shot={shot}",
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if not png.exists():
            print(f"FAIL {shot}: no screenshot produced\n{r.stdout}\n{r.stderr}")
            return 1
        img = Image.open(png).convert("RGB")
        if img.size != (1280, 720):
            print(f"FAIL {shot}: size {img.size} != (1280, 720)")
            return 1
        jpg = OUT / name
        img.save(jpg, "JPEG", quality=92)
        print(f"{name}: {jpg.stat().st_size} B sha256={sha256(jpg)}")
    print("render_r14: all 4 shots done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
