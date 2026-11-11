#!/usr/bin/env python3
"""Build the Lip Bunny Wellness Patient Guide.

Each page body lives in src/<slug>.html. This script wraps it in the shared
header/footer, builds the on-page jump menu from <section id> + <h2>, and
writes a search index (assets/search-index.js) from every section, heading and
accordion that has an id.

Edit content in src/, then run:  python3 build.py
"""
import json, re, html
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent
SRC, OUT = ROOT / "src", ROOT.parent

PHONE = "(508) 388-2200"
TEL = "tel:+15083882200"
ADDRESS = "484 Highland Ave, Fall River, MA"
MAPS = "https://maps.google.com/?q=484+Highland+Ave+Fall+River+MA"
MAIN_SITE = "https://ashleybrown7742.github.io/Thewellnesshunny/"
FULLSCRIPT = "https://us.fullscript.com/welcome/lipbunnybeauty/signup"

# slug, nav label, page title, eyebrow, heading, intro
PAGES = [
    ("index", "Home", "Patient Guide", "", "", ""),
    ("start-here", "Start Here", "Start Here", "Welcome to the Bunny Reset",
     "Start <span class='accent'>here.</span>",
     "The why behind everything you'll do. Read this first, then come back whenever you need a reminder."),
    ("your-program", "Your Program", "Your Program", "Your Roadmap",
     "Your program, week by week.",
     "What happens, when it happens, and what your job is at each step."),
    ("daily-habits", "Daily Habits", "Daily Habits", "Small Changes, Big Results",
     "Daily habits.",
     "One habit at a time, in order. This is the real protocol."),
    ("food", "Food", "Food & Recipes", "Eat to Feed Your Soil",
     "Food, meals & recipes.",
     "What to lean into, what to take a break from, and easy meals for real life."),
    ("remedies", "Natural Remedies", "Natural Remedies", "Gentle Support at Home",
     "Natural remedies & swaps.",
     "Baths, teas, herbs, binders and simple swaps that support your body between visits."),
    ("supplements", "Supplements", "Supplements", "Your Customized Plan",
     "Supplements, simplified.",
     "What each one does, when to take it, and the rules that keep you safe."),
    ("fast-days", "Fast Days", "ProLon Fast Guide", "One Day, With Food",
     "Your ProLon fast guide.",
     "Everything you need for an easy fast day: the day before, the day of, and the day after."),
    ("testing", "Testing", "Testing & Labs", "Prep for Accurate Results",
     "Testing & lab prep.",
     "How to prepare for your blood draw and how to collect your at-home kits."),
    ("lip-bunny-rx", "Lip Bunny Rx", "Lip Bunny Rx Patient Guides", "Lip Bunny Rx",
     "Injections, hormones & skin.",
     "How-to guides for patients on GLP-1 injections, bioidentical hormones, and GHK-Cu. Always follow the dose on your label."),
    ("tracker", "Tracker", "Weekly Tracker", "Track How You Feel",
     "Your weekly tracker.",
     "Rate how you feel once a week, on the same day. Bring it to every visit."),
    ("faq", "FAQ", "FAQ", "Got Questions?",
     "Frequently asked questions.",
     "Quick answers to what patients ask us most."),
    ("contact", "Contact", "Contact Us", "We're Here",
     "Contact the office.",
     "Questions, scheduling, or something doesn't feel right? Reach out. We'd always rather hear from you."),
]
NAV = ["start-here", "your-program", "daily-habits", "food", "remedies", "supplements", "fast-days", "testing", "lip-bunny-rx", "faq", "contact"]
# Grouped main menu: (label, landing page, [pages])
GROUPS = [
    ("My Program", "your-program", ["start-here", "your-program", "fast-days", "tracker"]),
    ("Habits & Food", "daily-habits", ["daily-habits", "food"]),
    ("Natural Remedies", "remedies", ["remedies"]),
    ("Supplements", "supplements", ["supplements"]),
    ("Testing & Rx", "testing", ["testing", "lip-bunny-rx"]),
    ("Help", "faq", ["faq", "contact"]),
]
LABEL = {p[0]: p[1] for p in PAGES}
TITLE = {p[0]: p[2] for p in PAGES}

def href(slug):
    return "index.html" if slug == "index" else f"{slug}.html"

def header(active):
    items = []
    for label, landing, pages in GROUPS:
        on = active in pages
        cls = ' class="active"' if on else ''
        if len(pages) == 1:
            items.append(f'<div class="nav-item"><a href="{href(landing)}"{cls}{" aria-current=\"page\"" if on else ""}>{label}</a></div>')
        else:
            sub = "".join(f'<a href="{href(p)}"{" class=\"active\" aria-current=\"page\"" if p == active else ""}>{TITLE[p]}</a>' for p in pages)
            items.append(f'<div class="nav-item has-sub"><a href="{href(landing)}"{cls}>{label}</a><div class="sub">{sub}</div></div>')
    links = "".join(items)
    return f'''<a class="skip" href="#main">Skip to content</a>
<div class="top">
  <div class="call-banner">Questions? Call <a href="{TEL}">{PHONE}</a> or message us in the Symplast for Patients app. &nbsp;<span class="muted">Emergency? Call 911.</span></div>
  <nav class="main" aria-label="Main">
    <div class="wrap">
      <a href="index.html" class="logo"><img class="logo-mark" src="assets/logo.svg" alt="Lip Bunny" width="46" height="46"><span class="logo-text"><b>Lip Bunny</b><small>Wellness &middot; Patient Guide</small></span></a>
      <div class="nav-links">{links}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="icon-btn" data-open-search aria-label="Search the guide">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>Search</button>
        <button class="icon-btn menu-btn" aria-expanded="false" aria-label="Menu">Menu</button>
      </div>
    </div>
  </nav>
</div>'''

def footer():
    col = lambda slugs: "".join(f'<li><a href="{href(s)}">{TITLE[s]}</a></li>' for s in slugs)
    return f'''<footer class="site">
  <div class="wrap">
    <div class="cols">
      <div>
        <a href="index.html" class="logo"><img class="logo-mark" src="assets/logo.svg" alt="Lip Bunny" width="46" height="46"><span class="logo-text"><b style="color:#fff">Lip Bunny</b><small style="color:var(--tan-light)">Wellness</small></span></a>
        <p style="margin-top:12px">A Lip Bunny Beauty Wellness program.<br>Root cause medicine that blends Eastern and Western care.</p>
        <p><a href="{TEL}">{PHONE}</a><br><a href="{MAPS}" target="_blank" rel="noopener">{ADDRESS}</a></p>
      </div>
      <div><h4>Your Program</h4><ul>{col(["start-here","your-program","daily-habits","food","remedies","supplements"])}</ul></div>
      <div><h4>Guides &amp; Help</h4><ul>{col(["fast-days","testing","lip-bunny-rx","tracker","faq","contact"])}</ul></div>
    </div>
    <div class="disclaimer">This guide is general patient education for Lip Bunny Beauty Wellness patients. It does not replace medical advice or the instructions from your provider. Always follow your own plan and your product labels. Compounded medications are not FDA-approved. In an emergency, call 911.<br>&copy; 2026 Lip Bunny Beauty Wellness &middot; Fall River, MA</div>
  </div>
</footer>
<div class="mobile-bar">
  <a href="index.html"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>Home</a>
  <button data-open-search><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>Search</button>
  <a href="tracker.html"><svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>Tracker</a>
  <a href="{TEL}"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>Call</a>
</div>
<div class="search-overlay" id="search" role="dialog" aria-modal="true" aria-label="Search the guide">
  <div class="search-box">
    <header>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8c6d4f" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="search-input" type="search" placeholder="Search remedies, supplements, injections, food…" autocomplete="off">
      <button class="close" type="button">Close</button>
    </header>
    <div class="results" id="search-results"></div>
  </div>
</div>
<script src="assets/search-index.js"></script>
<script src="assets/app.js"></script>'''

HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} · Lip Bunny Wellness</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#1d1b19">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
'''

def page_head(slug, eyebrow, heading, intro):
    return f'''<header class="page-head">
  <div class="wrap">
    <div class="crumbs"><a href="index.html">Patient Guide</a> &rsaquo; {LABEL[slug]}</div>
    <h1>{heading.replace("class='accent'", 'style="color:var(--tan-light)"')}</h1>
    <p>{intro}</p>
  </div>
</header>'''

def jump_nav(soup):
    items = []
    for sec in soup.find_all("section", id=True):
        h2 = sec.find("h2")
        if h2 and not sec.has_attr("data-nojump"):
            items.append((sec["id"], sec.get("data-short") or h2.get_text(" ", strip=True)))
    if len(items) < 3:
        return ""
    links = "".join(f'<a href="#{i}">{html.escape(t)}</a>' for i, t in items)
    return f'<nav class="jump" aria-label="On this page"><div class="wrap">{links}</div></nav>'

def clean(t):
    return re.sub(r"\s+", " ", t).strip()

def index_entries(slug, soup):
    out, page = [], TITLE[slug]
    for el in soup.find_all(id=True):
        if el.name not in ("section", "details", "h3", "div", "article"):
            continue
        if el.name == "section":
            h = el.find("h2")
        elif el.name == "details":
            h = el.find("summary")
        elif el.name == "h3":
            h = el
        else:
            h = el.find(["h3", "h4"])
        if not h:
            continue
        title = clean(h.get_text(" "))
        # body text: for h3 take following siblings until next heading
        if el.name == "h3":
            parts = []
            for sib in el.find_next_siblings():
                if sib.name in ("h2", "h3"):
                    break
                parts.append(sib.get_text(" "))
            body = clean(" ".join(parts))
        else:
            body = clean(el.get_text(" ")).replace(title, "", 1).strip()
        out.append({"p": page, "t": title, "u": f"{href(slug)}#{el['id']}", "b": body[:600],
                    "k": el.get("data-keywords", "")})
    return out

def build():
    index = []
    for slug, label, title, eyebrow, heading, intro in PAGES:
        raw = (SRC / f"{slug}.html").read_text()
        soup = BeautifulSoup(raw, "html.parser")
        desc = intro or "Your quick resource for the Bunny Reset: remedies, food, supplements, injections, testing prep and FAQs."
        parts = [HEAD.format(title=title, desc=html.escape(re.sub('<[^>]+>', '', desc))), header(slug), '<main id="main">']
        if slug != "index":
            parts.append(page_head(slug, eyebrow, heading, intro))
            parts.append(jump_nav(soup))
        body = raw.replace("{{PHONE}}", PHONE).replace("{{TEL}}", TEL).replace("{{ADDRESS}}", ADDRESS) \
                  .replace("{{MAPS}}", MAPS).replace("{{MAIN_SITE}}", MAIN_SITE).replace("{{FULLSCRIPT}}", FULLSCRIPT)
        parts += [body, "</main>", footer(), "</body>\n</html>\n"]
        (OUT / f"{href(slug)}").write_text("\n".join(parts))
        index += index_entries(slug, BeautifulSoup(body, "html.parser"))
    # Page-level entries
    for slug, label, title, eyebrow, heading, intro in PAGES:
        if slug != "index":
            index.append({"p": "Page", "t": title, "u": href(slug), "b": re.sub('<[^>]+>', '', intro), "k": label})
    # Recipes: pop-up data for the food page + search entries
    recipes = json.loads((ROOT / "recipes.json").read_text())
    (OUT / "assets" / "recipes.js").write_text("window.RECIPES=" + json.dumps(recipes, ensure_ascii=False) + ";\n")
    for rid, r in recipes.items():
        index.append({"p": "Recipe", "t": r["title"], "u": f"food.html#r-{rid}",
                      "b": "Ingredients: " + ", ".join(r["ingredients"]), "k": "recipe " + r["tag"]})
    # Supplement library: pop-up data + search entries
    supps = json.loads((ROOT / "supplements.json").read_text())
    (OUT / "assets" / "supplements.js").write_text("window.SUPPS=" + json.dumps(supps, ensure_ascii=False) + ";\n")
    for sid, x in supps.items():
        index.append({"p": "Supplement", "t": f'{x["name"]} ({x["brand"]})', "u": f"supplements.html#s-{sid}",
                      "b": x["what"] + " When: " + x["when"] + ". " + " ".join(x["tips"]), "k": "supplement " + x["cat"]})
    (OUT / "assets" / "search-index.js").write_text("window.GUIDE_INDEX=" + json.dumps(index, ensure_ascii=False) + ";\n")
    print(f"Built {len(PAGES)} pages, {len(index)} search entries")

if __name__ == "__main__":
    build()
