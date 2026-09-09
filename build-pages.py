#!/usr/bin/env python3
"""
Generate entry pages from assets/entries.js using the article / project
templates. Pages that already exist are never overwritten — the three
pages reproduced verbatim from the reference mockups are hand-authored.

Entries with no body text yet render the sparse state: the coordinate
rail, the title, and one mono line admitting the text does not exist.
No prose is invented. Re-run after editing entries.js.

    python3 build-pages.py
"""
import json, pathlib, subprocess, html, re

ROOT = pathlib.Path(__file__).parent
CONTENT = json.loads((ROOT / "content.json").read_text()) if (ROOT / "content.json").exists() else {}

ENTRIES = json.loads(subprocess.run(
    ["node", "-e", "global.window={};require('./assets/entries.js');"
                   "console.log(JSON.stringify(window.ENTRIES))"],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout)

NAV = '''  <header class="site-header">
    <a class="wordmark" href="/">Oleena Mak</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/writing/">Writing</a>
      <a href="/projects/">Projects</a>
      <a href="/about/">About</a>
      <span class="hint" title="Press / to filter the index">/ search</span>
    </nav>
    <!-- Native <details> so the mobile nav works without JavaScript.
         `display: contents` at <=720px lets the panel wrap to its own
         full-width row inside the header. -->
    <details class="menu">
      <summary class="menu-toggle">menu</summary>
      <nav class="menu-panel" aria-label="Primary, mobile">
        <a href="/writing/">Writing</a>
        <a href="/projects/">Projects</a>
        <a href="/about/">About</a>
      </nav>
    </details>
  </header>'''

FOOT = '''  <footer class="site-footer">
    <a href="https://www.linkedin.com/in/oleenamak/" rel="me noopener">linkedin</a><span class="sep"> &middot; </span><a href="https://x.com/ohmaak_" rel="me noopener">x</a><span class="sep"> &middot; </span><a href="https://omak.substack.com/" rel="me noopener">newsletter</a>
  </footer>'''

def q(s):
    return s.replace(" ", "%20")

def coords(e):
    rows = [("kind", f'<a href="/?kind={q(e["kind"])}">{e["kind"]}</a>'),
            ("date", e["date"])]
    if e.get("edit"):
        rows.append(("edit", e["edit"]))
    if e.get("status"):
        rows.append(("state", e["status"]))
    if e.get("subjects"):
        rows.append(("subj", ", ".join(
            f'<a href="/?subj={q(s)}">{s}</a>' for s in e["subjects"])))
    if e.get("ctx"):
        rows.append(("ctx", f'<a href="/?ctx={q(e["ctx"])}">{e["ctx"]}</a>'))
    if e.get("series"):
        rows.append(("series", e["series"]))
    if e.get("read"):
        rows.append(("read", e["read"]))
    body = "\n".join(f"        <dt>{k}</dt><dd>{v}</dd>" for k, v in rows)
    return f'      <dl class="coords">\n{body}\n      </dl>'

def where(e):
    """Every article ends by placing itself in the index. DESIGN-SYSTEM §10."""
    out = []
    if e.get("subjects"):
        s = e["subjects"][0]
        n = sum(1 for x in ENTRIES
                if s in x.get("subjects", []) and x["slug"] != e["slug"])
        if n:
            out.append(f'<a href="/?subj={q(s)}">{n} other entr'
                       f'{"y" if n == 1 else "ies"} under {s} &rarr;</a>')
    if e.get("ctx"):
        out.append(f'<a href="/?ctx={q(e["ctx"])}">everything from {e["ctx"]} &rarr;</a>')

    same = sorted([x for x in ENTRIES if x["kind"] == e["kind"]],
                  key=lambda x: x["date"])
    i = [x["slug"] for x in same].index(e["slug"])
    if i > 0:
        out.append(f'<a href="{same[i-1]["slug"]}">previous {e["kind"]} &larr;</a>')
    if i < len(same) - 1:
        out.append(f'<a href="{same[i+1]["slug"]}">next {e["kind"]} &rarr;</a>')

    if not out:
        return "\n        <!-- auto:where --><!-- /auto:where -->"
    links = "\n".join(f"            {l}" for l in out)
    return f'''
        <!-- auto:where -->
        <footer class="block block--ruled">
          <h2 class="label">Where this sits</h2>
          <div class="coordinates-out">
{links}
          </div>
        </footer>
        <!-- /auto:where -->'''

def inline(t):
    """Keep <em> and <a href>. DESIGN-SYSTEM §10 allows italic emphasis only,
    so <strong> — which the old site used for list lead-ins — maps to <em>
    rather than being dropped, preserving her emphasis without bold.
    Source tags carry attributes, so every pattern must tolerate them."""
    t = re.sub(r"<strong\b[^>]*>", "<em>", t)
    t = re.sub(r"</strong\s*>", "</em>", t)
    t = re.sub(r"<em\b[^>]*>", "<em>", t)
    t = re.sub(r"</em\s*>", "</em>", t)
    t = re.sub(r'<a\b[^>]*?href="([^"]+)"[^>]*>', lambda m:
               f'<a href="{m.group(1)}"' +
               (' rel="noopener"' if m.group(1).startswith("http") else "") + ">", t)
    t = re.sub(r"</a\s*>", "</a>", t)
    t = re.sub(r"<(?!/?(?:em|a)[\s>])[^>]*>", "", t)
    # drop any emphasis left unbalanced by the source markup
    if t.count("<em>") != t.count("</em>"):
        t = t.replace("<em>", "").replace("</em>", "")
    return t.strip()


def render_body(c, key):
    """Renders the migrated blocks. Three treatments here are derived rather
    than specified — the reference article has no subheads, no lists and no
    real images. Each is built from the existing scale and components; see
    .subhead / .prose-list / .plate img in site.css."""
    out, plate_n, i, blocks = [], 0, 0, c["blocks"]
    while i < len(blocks):
        b = blocks[i]
        if b["type"] == "p":
            out.append(f"          <p>{inline(b['text'])}</p>")
            i += 1
        elif b["type"] == "h3":
            out.append(f"          <h2 class=\"label subhead\">{inline(b['text'])}</h2>")
            i += 1
        elif b["type"] == "li":
            items = []
            while i < len(blocks) and blocks[i]["type"] == "li":
                items.append(f"            <li>{inline(blocks[i]['text'])}</li>")
                i += 1
            out.append("          <ul class=\"prose-list\">\n" + "\n".join(items) + "\n          </ul>")
        elif b["type"] == "img":
            plate_n += 1
            cap = b.get("alt") or ""
            caption = f"{plate_n:02d} &middot; {cap}" if cap else f"{plate_n:02d}"
            out.append(
                '          <figure class="plates plates--full">\n'
                '            <div class="plate-figure">\n'
                f'              <img class="plate" src="/assets/img/{b["local"]}" alt="{cap}" loading="lazy">\n'
                f'              <figcaption class="plate-caption">{caption}</figcaption>\n'
                '            </div>\n'
                '          </figure>')
            i += 1
        else:
            i += 1
    return "\n".join(out)


def page(e):
    project = e["kind"] == "project"
    title = html.escape(e["title"])
    rail = coords(e)
    if project:   # only the project rail is labelled — see the reference
        rail = ('      <div class="block">\n'
                '        <h2 class="label">Coordinates</h2>\n'
                + rail.replace("      <dl", "        <dl").replace("      </dl>", "        </dl>")
                + "\n      </div>")

    key = e["slug"].strip("/").split("/")[-1]
    if key in CONTENT:
        body = render_body(CONTENT[key], key)
    elif e["kind"] == "drawing":
        body = f'''        <figure class="plates plates--full">
          <div class="plate-figure">
            <div class="plate" role="img" aria-label="Placeholder for plate 01, {title}"></div>
            <figcaption class="plate-caption">01 &middot; {e["title"]}</figcaption>
          </div>
        </figure>'''
    else:
        body = '        <p class="empty">no text yet</p>'

    deck = f'<p class="deck">{html.escape(e["deck"])}</p>' if e.get("deck") else ""
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} &middot; Oleena Mak</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..500&display=swap">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<div class="frame">

{NAV}

  <div class="layout layout--article">

    <aside class="rail">
{rail}
    </aside>

    <main class="column">
      <article class="column">
        <!-- auto:body -->
        <div class="masthead">
          <h1 class="title{' title--project' if project else ''}">{title}</h1>
          {deck}
        </div>

        <div class="prose{' prose--project' if project else ''}">
{body}
        </div>
        <!-- /auto:body -->
{where(e)}
      </article>
    </main>

  </div>

{FOOT}

</div>
<script src="/assets/chrome.js"></script>
</body>
</html>
'''

def page_path(e):
    """A slug ending in "/" is a directory URL: /writing/x/ -> writing/x/index.html"""
    rel = e["slug"].lstrip("/")
    return ROOT / (rel + "index.html" if rel.endswith("/") else rel)


def body_region(e):
    """The masthead + prose block, for pages whose text comes from content.json."""
    key = e["slug"].strip("/").split("/")[-1]
    if key not in CONTENT:
        return None
    deck = f'<p class="deck">{html.escape(e["deck"])}</p>' if e.get("deck") else ""
    project = e["kind"] == "project"
    return ('<!-- auto:body -->\n        <div class="masthead">\n'
            f'          <h1 class="title{" title--project" if project else ""}">'
            f'{html.escape(e["title"])}</h1>\n          {deck}\n        </div>\n\n'
            f'        <div class="prose{" prose--project" if project else ""}">\n'
            f'{render_body(CONTENT[key], key)}\n        </div>\n        <!-- /auto:body -->')


def refresh(path, e):
    """Rewrite only the marked regions. Prose, decks, bespoke rail blocks and
    everything else in the file are left exactly as they are."""
    s = path.read_text()
    out, changed = s, []
    for name, fresh in (("coords", coords(e)),
                        ("body", body_region(e)),
                        ("where", where(e).strip("\n"))):
        if fresh is None:
            continue
        pat = re.compile(f"<!-- auto:{name} -->.*?<!-- /auto:{name} -->", re.S)
        if not pat.search(out):
            continue
        new = pat.sub(lambda _: fresh.strip(), out, count=1)
        if new != out:
            out, _ = new, changed.append(name)
    if out != s:
        path.write_text(out)
    return changed

made, refreshed, untouched = [], [], []
for e in ENTRIES:
    p = page_path(e)
    if p.exists():
        ch = refresh(p, e)
        (refreshed if ch else untouched).append((e["slug"], ch))
        continue
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(page(e))
    made.append(e["slug"])

print(f"created {len(made)}, refreshed {len(refreshed)}, unchanged {len(untouched)}")
for s_ in made:
    print("  created  ", s_)
for s_, ch in refreshed:
    print("  refreshed", s_, "(" + ", ".join(ch) + ")")
