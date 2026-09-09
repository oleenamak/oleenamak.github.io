#!/usr/bin/env python3
"""
Renders the favicon and per-page OpenGraph cards with headless Chrome, so they
use the real Newsreader / JetBrains Mono and the real palette. Nothing here is
a new visual treatment: paper ground, ink wordmark, hard rule, serif title,
mono metadata — the same parts as a page header.

    python3 make-images.py       (dev only; output is committed)
"""
import json, pathlib, subprocess, tempfile, html, sys

ROOT = pathlib.Path(__file__).parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONTS = ('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=JetBrains+Mono:wght@400&family=Newsreader:opsz,wght@6..72,400&display=swap">')

ENTRIES = json.loads(subprocess.run(
    ["node", "-e", "global.window={};require('./assets/entries.js');"
                   "console.log(JSON.stringify(window.ENTRIES))"],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout)

MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]


def shot(markup, out, w, h):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(markup); tmp = f.name
    for flag in ("--headless=new", "--headless"):
        r = subprocess.run(
            [CHROME, flag, "--disable-gpu", "--hide-scrollbars",
             f"--screenshot={out}", f"--window-size={w},{h}",
             "--virtual-time-budget=6000", f"file://{tmp}"],
            capture_output=True, text=True)
        if pathlib.Path(out).exists():
            return True
    print("  render failed:", r.stderr[-300:], file=sys.stderr)
    return False


def og_card(title, deck, meta):
    return f"""<!doctype html><meta charset="utf-8">{FONTS}
<style>
 html,body{{margin:0;padding:0}}
 body{{width:1200px;height:630px;background:#f5f4f1;color:#1f1f22;
   font-family:Newsreader,Georgia,serif;box-sizing:border-box;padding:64px 72px;
   display:flex;flex-direction:column}}
 .wordmark{{font-family:'JetBrains Mono',monospace;font-size:20px;letter-spacing:.14em;
   text-transform:uppercase;color:#17181a}}
 .rule{{border-bottom:2px solid #17181a;margin-top:22px}}
 .mid{{flex:1;display:flex;flex-direction:column;justify-content:center;gap:24px}}
 h1{{font-size:72px;line-height:1.1;font-weight:400;margin:0;letter-spacing:-.01em;
   max-width:19ch}}
 .deck{{font-size:30px;line-height:1.5;color:#3a3a3d;margin:0;max-width:34ch}}
 .meta{{font-family:'JetBrains Mono',monospace;font-size:18px;color:#8f8e88;
   text-transform:uppercase;letter-spacing:.08em}}
</style>
<div class="wordmark">Oleena Mak</div><div class="rule"></div>
<div class="mid"><h1>{html.escape(title)}</h1>
{f'<p class="deck">{html.escape(deck)}</p>' if deck else ''}</div>
<div class="meta">{html.escape(meta)}</div>"""


FAVICON = """<!doctype html><meta charset="utf-8">""" + FONTS + """
<style>
 html,body{margin:0;padding:0}
 body{width:512px;height:512px;background:#17181a;display:flex;
   align-items:center;justify-content:center}
 span{font-family:'JetBrains Mono',monospace;font-size:250px;color:#f5f4f1;
   line-height:1}
</style><span>om</span>"""

if __name__ == "__main__":
    print("favicon")
    shot(FAVICON, str(ROOT / "assets/og/_icon512.png"), 512, 512)

    print("og: default")
    shot(og_card("Oleena Mak",
                 "Operator and marketer. This is the index of what I've been "
                 "thinking about, in public, since 2023.",
                 "oleenamak.github.io"),
         str(ROOT / "assets/og/default.png"), 1200, 630)

    for e in ENTRIES:
        slug = e["slug"].strip("/").split("/")[-1]
        d = e["date"].split("-")
        meta = f'{e["kind"]} · {MONTHS[int(d[1])-1]} {d[2]}, {d[0]}'
        print("og:", slug)
        shot(og_card(e["title"], e.get("deck"), meta),
             str(ROOT / f"assets/og/{slug}.png"), 1200, 630)
