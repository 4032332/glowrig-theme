# GlowRig — Claude Code Handover Brief

> This file is the authoritative context document for Claude Code.
> Read this entire file before touching any code.

---

## What This Project Is

**GlowRig** is a Shopify dropshipping store selling gaming desk accessories and RGB lighting to the Australian market. Target demographic is 16–28 year olds building aesthetic gaming/streaming setups. The brand positioning is "premium aesthetic at accessible prices" — not budget gear, not enterprise gaming, but the finishing touches that make a setup look intentional.

The store is owned by Rob Brown (QPS Senior Sergeant, North Lakes QLD) and is one of two dropshipping ventures. The second store (phone mounts / lifestyle accessories, unnamed) is a separate project not covered here.

---

## Current State

### What Exists

**GitHub repo:** `https://github.com/4032332/glowrig-theme`
**Branch:** `main`
**Contents:** A complete custom Shopify Liquid theme

**Shopify store:** Connected to the GitHub repo. Theme is live (or pending publish).

**Dropshipping suppliers connected:**
- CJDropshipping (primary — AU warehouse available for key SKUs)
- DropshipZone (Australian local supplier)

**Interactive store preview:** A React/TypeScript/Tailwind artifact was built in Claude.ai that shows the full store design including all pages, animations, and interactions. This is the design reference.

### Products Confirmed and Described

All descriptions, titles, tags, and pricing have been written. Products are:

| Product | SKU Prefix | Drop Cost | Retail | Supplier |
|---|---|---|---|---|
| Cosmic Desk Mat (Galactic Series) | GR-MAT-COS | $18–23 | $49.95–$59.95 | CJDropshipping |
| Japanese Desk Mat (Edo Series) | GR-MAT-EDO | $23 | $59.95 | CJDropshipping |
| Monitor Light Bar (ScreenGlow) | GR-LB | $25–27 | $59.95–$69.95 | DSers/AliExpress |
| RGBIC Monitor Bias Lighting | GR-BIAS | $14 | $39.95–$54.95 | DSers/AliExpress |
| RGB AtmoBar (AtmoBar Series) | GR-ATMO | $9–15 | $29.95–$49.95 | CJDropshipping |
| RGB Headphone Stand (PeakStand) | GR-HS | $13 | $44.95 | CJDropshipping |
| Starter Rig Bundle | GR-BUNDLE | ~$50 | $109.95 | Mixed |

A product import CSV (`glowrig-products.csv`) was generated and is available in the outputs directory.

### Collections

- `desk-mats` — Cosmic Series + Edo Series mats
- `lighting` — Monitor light bar + RGBIC bias lighting + AtmoBar
- `organisation` — PeakStand headphone stand (more products to add)
- `bundles` — Starter Rig Bundle

---

## Brand & Design System

### Identity

- **Name:** GlowRig
- **Logo:** SVG lightning bolt in a rounded square frame, purple-to-cyan gradient
- **Tagline:** "Level Up Your Rig."
- **Voice:** Casual, confident, community-aware. "Your setup" / "your rig" language. Not corporate.

### Colour System

```css
--bg-primary: #0a0a0f       /* near-black base */
--bg-secondary: #12121a     /* section alternator */
--bg-card: #16161f          /* card backgrounds */
--accent-purple: #b44fff    /* primary neon accent */
--accent-cyan: #00f5ff      /* secondary neon accent */
--accent-pink: #ff44aa      /* badge / hot accent */
--text-primary: #ffffff
--text-secondary: #8888aa
--text-muted: #555577
--border-subtle: rgba(180,79,255,0.15)
--border-glow: rgba(180,79,255,0.4)
```

### Typography

- **Display:** Orbitron (900 weight) — hero titles, prices, logo, stat numbers
- **Heading:** Rajdhani (600–700) — nav, card titles, buttons, eyebrows, labels
- **Body:** Inter (400–500) — descriptions, body copy
- All from Google Fonts. Load via `@import` or `<link>` in theme head.

### Design Principles

- Dark backgrounds always. No light mode.
- Neon accents — purple primary, cyan secondary. One per element, not both.
- Glow effects via `box-shadow` and `filter: drop-shadow()` on key elements.
- Cards elevate (`translateY(-6px)`) and glow on hover.
- Section headers: eyebrow (cyan, small caps) → title (Rajdhani, large) → descriptor (Inter, muted).
- Buttons: primary = purple gradient + glow shadow. Outline = cyan border.

---

## Theme Architecture (GitHub Repo)

```
glowrig-theme/
├── assets/
│   ├── theme.css          # Full stylesheet (~1200 lines)
│   └── theme.js           # All JS including animations (~400 lines)
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/
│   └── theme.liquid       # Main layout: header, footer, cart drawer, search overlay
├── snippets/
│   ├── product-card.liquid
│   └── cart-drawer-items.liquid
└── templates/
    ├── index.liquid        # Homepage
    ├── product.liquid      # Product detail page
    ├── collection.liquid   # Collection/shop page
    ├── cart.liquid         # Cart page
    └── 404.liquid          # 404 page
```

### Current Theme Limitations (Priority Fixes for Claude Code)

The current theme was hand-written without a local dev server. Known gaps:

1. **No Shopify schema blocks** — The theme editor (Shopify Admin → Themes → Customise) shows nothing customisable. Sections need `{% schema %}` JSON to expose drag-and-drop editing. This is the biggest gap for non-technical management.

2. **No `locales/en.default.json`** — Shopify requires this for theme validation. Currently missing.

3. **No `sections/` directory** — The homepage content is hardcoded in `templates/index.liquid`. It should be refactored into `sections/` with schema blocks.

4. **Mobile nav uses inline style toggles** — Should use a proper CSS class toggle pattern.

5. **No `{% paginate %}` on collection pages** — Will break with more than 50 products.

6. **Cart drawer items are static** — The `cart-drawer-items` snippet renders server-side but doesn't update dynamically after AJAX cart additions. Needs a fetch-and-re-render pattern.

---

## Priority Build List for Claude Code

These are ordered by business impact. Do them in sequence.

### PHASE 1 — Make the Existing Theme Production-Ready (Week 1)

**1.1 Add `locales/en.default.json`**
Shopify theme validation requires this. Minimum viable content:
```json
{ "general": { "404": { "title": "Page not found" }, "cart": { "title": "Your cart" } } }
```

**1.2 Create `sections/` architecture**
Move homepage content from `templates/index.liquid` into discrete sections:
- `sections/announcement-bar.liquid`
- `sections/hero.liquid`
- `sections/featured-collections.liquid`
- `sections/featured-products.liquid`
- `sections/featured-banner.liquid`
- `sections/bundle-feature.liquid`
- `sections/why-glowrig.liquid`
- `sections/reviews.liquid`
- `sections/email-signup.liquid`

Each section needs a `{% schema %}` block exposing editable fields (heading text, button labels, collection to pull from, etc.).

**1.3 Fix dynamic cart drawer**
After `POST /cart/add.js`, re-fetch `/cart.js` and re-render the cart drawer HTML client-side. Current implementation opens the drawer but doesn't update item list without a page refresh.

**1.4 Add pagination to collection template**
```liquid
{% paginate collection.products by 24 %}
  {% for product in collection.products %}...{% endfor %}
  {{ paginate | default_pagination }}
{% endpaginate %}
```

**1.5 Run `shopify theme check`**
Install Shopify CLI, run the linter against the theme, fix all errors and warnings before going live.

---

### PHASE 2 — Animation Upgrade (Week 2)

The current animations use CSS keyframes + IntersectionObserver. Upgrade to GSAP + ScrollTrigger.

**2.1 Install GSAP via CDN or npm**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

**2.2 Hero entrance sequence**
Replace current CSS transition stagger with a GSAP timeline:
```javascript
const tl = gsap.timeline({ delay: 0.2 });
tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
  .from('.hero-title', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
  .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
  .from('.hero-cta-group', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
  .from('.hero-stats > *', { y: 20, opacity: 0, stagger: 0.12, duration: 0.5 }, '-=0.2');
```

**2.3 Scroll-pinned hero reveal**
The hero title "LEVEL UP YOUR RIG" should assemble on scroll — pin the hero, have each word or letter animate in as the user scrolls down, then unpin and release to the next section. This is a 20-minute GSAP ScrollTrigger implementation that's impossible with CSS alone.

**2.4 Product card stagger on scroll**
```javascript
gsap.from('.product-card', {
  scrollTrigger: { trigger: '.products-grid', start: 'top 80%' },
  y: 48, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out'
});
```

**2.5 Install Lenis for smooth scroll**
```javascript
import Lenis from '@studio-freight/lenis';
const lenis = new Lenis({ lerp: 0.08, smooth: true });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
```
This makes the entire site feel like a premium web experience. It's a 10-line implementation.

---

### PHASE 3 — Three.js Hero (Week 3, Optional but High Impact)

Replace the emoji-based hero product showcase with a 3D animated desk setup.

**3.1 Basic Three.js scene setup**
```javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
```

**3.2 Geometry to build**
- Flat rectangular plane = desk surface
- Thin rectangular boxes = monitor, keyboard, mouse
- Neon point lights in purple and cyan
- Slow auto-rotate on Y axis
- Mouse parallax: `camera.position.x = mouseX * 0.3`

**3.3 Neon glow via post-processing**
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
```
This creates the neon glow bloom effect around the RGB elements.

---

### PHASE 4 — Automation and Tooling (Week 4+)

**4.1 Product import automation**
Write a Node.js script that reads a CJDropshipping product feed CSV and auto-generates:
- Shopify product import CSV with correct fields
- Formatted descriptions using the GlowRig voice
- Tags mapped to collection handles
- Pricing at target margins

**4.2 "Build Your Rig" quiz**
A multi-step quiz section:
1. "What's your setup?" (PC / Console / Streamer / All three)
2. "What's your monitor size?" (24" / 27" / 32" / 34"+)
3. "What's your vibe?" (Dark & moody / Clean & minimal / Colourful & bold)

Output: a curated product recommendation with a "Shop This Setup" CTA. Implemented as a Shopify section with Liquid + vanilla JS, no external dependencies.

**4.3 Metafield-driven product specs**
Instead of hardcoding specs in product descriptions, store them as Shopify metafields:
- `custom.features` — JSON array of feature strings
- `custom.drop_cost` — internal field (not displayed)
- `custom.supplier` — CJ / DropshipZone / DSers

Display in the theme with `{{ product.metafields.custom.features.value }}`.

---

## Setup Instructions for Claude Code

### Step 1 — Clone the repo

```bash
git clone https://github.com/4032332/glowrig-theme.git
cd glowrig-theme
```

### Step 2 — Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
```

### Step 3 — Connect to the store

```bash
shopify theme dev --store YOUR_STORE.myshopify.com
```

This opens a local dev server at `http://127.0.0.1:9292` that hot-reloads changes and proxies to the live Shopify store.

### Step 4 — Run theme check

```bash
shopify theme check
```

Fix all errors before any other work.

### Step 5 — Push changes

```bash
git add .
git commit -m "Description of change"
git push origin main
```

Shopify auto-pulls from GitHub on push (if the GitHub integration is configured in Shopify Admin → Online Store → Themes).

---

## Key Decisions Already Made (Don't Reverse Without Good Reason)

- **Dark-only theme.** No light mode. Non-negotiable for the brand.
- **Orbitron for display, Rajdhani for headings, Inter for body.** This trio is locked in.
- **Purple (#b44fff) as primary, cyan (#00f5ff) as secondary.** Use one per element.
- **"Organisation" not "Stands"** — the collection handle is `/collections/organisation`
- **Free shipping threshold: $75 AUD** — referenced in cart drawer and announcement bar
- **30-day returns policy** — referenced in product pages and footer
- **All prices in AUD** — the store is AU-only at launch
- **Bundle pricing:** Starter Rig Bundle at $109.95 (RRP $179.85, save $69.90)
- **No stream deck / alternative stream controller** — margin too thin, price too close to genuine Elgato product
- **No branded products** — everything listed must be unbranded or own-brand. New Bee, Razer, Logitech etc. cannot be listed.

---

## Owner Context

Rob Brown. QPS Senior Sergeant. North Lakes QLD. ADHD (98th percentile) + ASD Level 1 — weaponised as strengths. Highly detail-oriented, fast information absorption, values time-saving above almost everything else. Also studying LLB at QUT and co-running ReLaytable Content (AI video ad agency with partner Jaimi). Time is the primary constraint.

**Communication style for Claude Code:** Direct, no filler, no unnecessary explanation of what you're doing. Show the work, not the thought process. If something is unclear, ask one specific question before proceeding.

---

## Files to Create First

When starting a Claude Code session on this project, create these files before anything else:

1. `locales/en.default.json` — theme validation will fail without it
2. `sections/hero.liquid` — move hero out of index.liquid
3. `shopify.theme.toml` — Shopify CLI config file

Then run `shopify theme check` and address all warnings.

---

*Handover brief written June 2026. Current theme version: 1.0.1 (post-navigation fix)*
