# GlowRig Tasks

## In Progress

## Todo

## Done

### PHASE 1 — Production-Ready Theme ✅
- [x] 1.1 Add `locales/en.default.json`
- [x] 1.2 Create `sections/` architecture (9 sections with schema blocks)
- [x] 1.3 Fix dynamic cart drawer (DOM-built from /cart.js after add-to-cart)
- [x] 1.4 Add `{% paginate %}` to collection template
- [x] 1.5 Run `shopify theme check` — 0 errors, 3 non-actionable warnings

### PHASE 2 — Animation Upgrade ✅
- [x] 2.1 GSAP 3.12.5 + ScrollTrigger via CDN
- [x] 2.2 Hero entrance sequence with GSAP timeline
- [x] 2.3 Scroll-pinned hero title word reveal (ScrollTrigger)
- [x] 2.4 Product card stagger on scroll (per-grid)
- [x] 2.5 Lenis smooth scroll integrated with GSAP ticker

### PHASE 3 — Three.js Hero ✅
- [x] 3.1 Three.js scene setup (ES module, loads only on hero section)
- [x] 3.2 Desk geometry: surface, mat, monitor, keyboard, mouse, headphone stand, light bar, AtmoBar
- [x] 3.3 UnrealBloomPass post-processing + neon purple/cyan point lights

### PHASE 4 — Automation & Tooling ✅
- [x] 4.1 `scripts/cj-to-shopify.js` — CJDropshipping CSV → Shopify import CSV
- [x] 4.2 `sections/rig-quiz.liquid` — "Build Your Rig" 3-step quiz with product recommendations
- [x] 4.3 `templates/product.liquid` — metafield-driven feature list (custom.features) + supplier tag
