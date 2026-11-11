# Wellness Hunny Patient Guide

The online version of the Lip Bunny Beauty Wellness welcome binder. A quick resource for patients: remedies, food, supplements, fast days, testing prep, Lip Bunny Rx how-tos, FAQ, a weekly tracker and contact info.

Live site (after GitHub Pages is turned on): https://ashleybrown7742.github.io/BunnyGuide-/

## How to edit

1. Edit the page content in `_build/src/` (one file per page, plain HTML).
2. Run `python3 _build/build.py` (needs `pip install beautifulsoup4`).
3. Commit and push. The site rebuilds the header, footer, page menus and search automatically.

Phone, address, Fullscript and main-site links live at the top of `_build/build.py`. Change them once there.

## Rules for content

- No exact prescription doses on this site. Patients follow their label.
- Don't name individual providers.
- Don't call the program a "detox". Use "the Reset".
- Every symptom section should say when to call the office and when to call 911.

## Pages

| File | Page |
|---|---|
| index.html | Home, search, topic tiles |
| start-here.html | Gut is soil, toxic bucket, mindset |
| your-program.html | 8/16-week tracks, roadmap, tools, after graduation |
| daily-habits.html | Habit priority order: hydration, electrolytes, sleep, stress, movement, diet |
| food.html | Lean in / break from, meal plan, grocery list, smoothies, treats |
| remedies.html | Symptom quick help, Bunny Bath, teas, herbs, binders, pH, filters, swaps |
| supplements.html | Core 5, safety rules, gut reset kit, add-ons, refills |
| fast-days.html | ProLon fast day guide |
| testing.html | Blood draw prep, gut, vaginal and cortisol kits |
| lip-bunny-rx.html | GLP-1 injection how-to, hormone therapy, GHK-Cu |
| tracker.html | Weekly tracker (saved only on the patient's device) |
| faq.html | FAQ |
| contact.html | Contact, who to contact for what, when to call 911 |
