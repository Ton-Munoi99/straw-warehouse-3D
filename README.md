# Handoff: Rice Straw Storage Warehouse — 3D Concept, BOQ & Pitch Deck

## Overview
A concept package for a **practical, low-cost rice-straw storage warehouse** located beside rice fields in rural Thailand, intended for a feasibility study / management & investor presentation. The package contains three deliverables:

1. An **interactive 3D-style concept model** of the warehouse (orbit, zoom, camera presets, openable doors/walls, weather, dimensions, labels).
2. A bilingual **Bill of Quantities (BOQ)** cost document with real 2025 (พ.ศ. 2568) Thai price references, material/labour split, and a cost-by-division chart.
3. A bilingual (Thai/English) **pitch + feasibility/ROI slide deck**.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show the intended look, content, and behaviour. They are **not production code to copy directly**. The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, Svelte, native, etc.) using its established components, styling system, and patterns. If no environment exists yet, choose the most appropriate stack for an interactive 3D product visualization (e.g. **React + Three.js / react-three-fiber + Tailwind** would map cleanly to what's here) and implement there.

The 3D scene is built with **Three.js (r128) + OrbitControls**. The DOM/UI (control panel, labels, info cards, BOQ tables, slides) is plain HTML with inline styles. The original prototypes are authored as "Design Components" (`.dc.html`) — a streaming wrapper — but you do **not** need that runtime; treat the markup + the logic class as ordinary HTML + a JS class and port them.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, geometry, copy, and interactions are all specified. Recreate the UI faithfully using the codebase's libraries. The 3D scene geometry is intentionally simplified massing (boxes/cylinders/extrusions) for a clean, fast, presentation-ready look — not photoreal CAD; preserve that style unless asked otherwise.

---

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Forest green (primary) | `#2f6b3f` | Primary brand, buttons, headings accents |
| Deep green (dark) | `#163a22` / `#1f4a2c` | Title/section slide backgrounds, summary cards |
| Straw / amber (secondary) | `#c8902f` | Secondary accent, highlights, ROI card |
| Ink (text) | `#1f2a24` / `#26342c` | Primary text |
| Muted text | `#54625a` / `#7c8a80` / `#9aa499` | Secondary text, kickers |
| App background (warm) | `#f4f1ea` / `#e9ece2` | Document/app background |
| Panel surface | `#ffffff` | Cards, panels |
| Hairline / border | `#e4e0d4` / `#e7e2d6` / `#ece8dc` | Borders, dividers |
| Pale green tint | `#eef5ee` / `#e7f1e8` | Active/positive chips |

**Zone accent colors (3D labels + BOQ + deck):**
storage `#c8902f` · loading `#2f6b3f`/`#5aa17a` · internal lane `#3f7fae` · ventilation `#5aa17a`/`#9ccfa9` · drainage `#7a6cc4` · roof/rain `#c25b46` · access road `#9a7b4f`

**3D material colors:** steel `#828a93` (metalness .65), dark steel `#5f666e`, roof metal `#c6cace`, concrete `#cfc9ba`, straw bales `#cda23f`/`#c79a36`/`#d3ab48`/`#c4972f`/`#d8b257`, grass `#7ca64d`, dirt `#c3a87f`/`#b89b6f`, canal water `#5fa0c4`, paddy green `#6fa83c`, wall/door panel `#c4ccd2`, tree foliage `#4f7d39`/`#5e8f43`/`#447033`, trunk `#6b4f2a`. Sky (sunny) `#d2e8f2`, sky (rainy) `#97a4ad`.

### Typography
- **Font family:** `'Plus Jakarta Sans'`, weights 400/500/600/700/800 (Google Fonts). Fallback `system-ui, sans-serif`.
- **Deck (1920×1080):** slide titles 54px/800; hero title 78px/800; section kickers 24px/700 uppercase letter-spacing .1em; body 22–30px; big stats 66–88px/800. Minimum on-slide text 24px (fine-print disclaimers 16px are intentional).
- **App/3D UI:** header title 16px/800; stat chips label 10px/600 uppercase, value 14px/700; panel section headers 11px/700 uppercase letter-spacing .08em; buttons 12.5–13px/600–700; labels 11–12px/700.
- **BOQ doc:** table body 12.5px; division headers 800; numbers use `font-variant-numeric: tabular-nums`, right-aligned.

### Spacing / radius / shadow
- Radii: chips/buttons 9–12px; cards 14–22px; pills 20px; 3D label pills 20px.
- Card shadow (deck): `0 10px 40px rgba(20,40,25,0.12)`. Label shadow: `0 4px 14px rgba(20,40,25,0.16)`.
- Generous padding: deck slides 96–110px; doc sheet 36px; panel 18px.

---

## Screens / Views

### A) 3D Concept Model — `Straw Warehouse 3D.dc.html`
**Purpose:** Let stakeholders explore the warehouse from any angle and understand its zones, structure, and weather/operational behaviour.

**Layout:** Full-viewport flex column.
- **Header (~64–72px):** logo tile (green, house icon) + title "Rice Straw Storage Warehouse" + subtitle, and right-aligned stat chips: Footprint `20 × 10 m`, Clear height `5.0 m eave`, Roof `Gable metal sheet`, Straw capacity `~1,500 bales · ~30 t`.
- **Main row:** 3D canvas (flex:1) on the left, **control panel 336px** fixed on the right (white, scrollable, `border-left`).
- **3D stage:** absolutely-positioned canvas + an absolutely-positioned overlay div for projected HTML labels; bottom-left hint pill "Drag to orbit · Scroll to zoom · Click a tag for details"; a loading veil removed on ready.

**Control panel sections (top→bottom):**
1. **Camera Views** — 2×2 grid: Front, Side, Top, Interior (active = filled green). Below: full-width **Rotate 360°** toggle (active = amber).
2. **Controls** — Zoom out / Zoom in (side by side); full-width **Show/Hide labels** toggle.
3. **Doors & Walls** — 2-up: **Doors: Open/Closed** (green), **Sides: Open/Closed** (blue `#3f7fae`); helper caption.
4. **Scene** — stacked: **Weather: Sunny/Rainy** (`#5a6b7a`), **Activity: On/Off** (amber), **Dimensions: On/Off** (`#33403a`).
5. **Key Zones** — clickable list (7 zones), each a colored dot + label; selecting highlights and updates the info card.
6. **Info card** — colored header (zone color or green) with kicker + title, body description; defaults to an overview.
7. **Project Benefits** — 5 checklist rows.

**3D scene contents (world units = metres):**
- Ground grass plane, dirt pad `30×17`, **raised concrete slab `21.4 × 0.6 × 11`** (top at y=0.6), front loading ramp, perimeter drainage channels, dirt access road, irrigation canal (+Z side), rice paddies (−Z), scattered trees.
- **Structure:** steel columns on a grid `x ∈ {−10,−6,−2,2,6,10}`, `z ∈ {−5,5}`; eave at y=5; gable **ridge at y=7.6** (z=0); eave beams, tie beams, trusses (bottom chord + 2 top chords + king post + web verticals), purlins, ridge cap, gutters, downpipes.
- **Roof:** two metal slopes meeting cleanly at the ridge with rib lines + ridge cap + **closed gable-end triangles** (front & back). Overhang ~1.2 m (z) / 1.5 m (x). Slope angle = `atan2(2.6, 5) ≈ 27.5°`.
- **Straw bales:** box `1.9 × 0.85 × 0.95`, stacked 4 layers in the storage zone (staggered alternate layers), plus a secondary 2-high stack and a few on the loading apron / truck bed.
- **Vehicles:** parked truck (cab+bed+wheels+bales) at front apron; **forklift that shuttles** along the internal lane when Activity is on.
- **Openable closures:** front **double swing doors** (two leaves hinged at the front gable end, swing outward ~106°); **roll-up side-wall panels**, one per structural bay on both long sides (animate by scaling height from the top, with a roll "drum" at the eave).

### B) Bill of Quantities — `Straw Warehouse BOQ.dc.html`
**Purpose:** Printable bilingual cost estimate for feasibility/contractor discussion. Print button → `window.print()` (A4-friendly `@media print`).

**Layout:** centered white sheet (max-width 940px) on warm bg.
- **Green header band:** doc kicker, title "โรงเก็บฟางอัดก้อน (Rice Straw Storage Warehouse)", doc no. `BOQ-SW-01`.
- **Meta grid (4 cols):** Project, Location, Footprint `20 × 10 m (200 m²)`, Structure `เหล็ก ผนังเปิด-ปิดได้ จั่ว`.
- **Table:** columns No. / Description (TH + EN, with reference superscript R1–R6) / Unit / Qty / Unit rate / Amount. Grouped into divisions A–H with a header row + per-division subtotal row.
- **Cost Analysis section:** horizontal bars of cost share per division, and a **Material vs Labour** stacked bar (currently 61% / 39%).
- **Benchmark box:** gradient bar 5,500–9,000 THB/m² with a marker at the project's cost/m².
- **Summary card:** Direct cost → OH & Profit 10% → Contingency 5% → VAT 7% → **Grand Total** → Cost per m².
- **References (R1–R6)** + disclaimer; footer.

**Cost data (THB):** 8 divisions, computed from `qty × rate`.
- A Site & Earthwork 49,800 · B Concrete & Foundation 315,800 · C Structural Steel 214,700 · D Roofing & Rain Protection 170,320 · E Drainage 64,200 · F Access Road & Apron 128,000 · G Services & Misc 59,000 · H Walls & Openable Doors 178,000.
- **Direct cost ฿1,179,820** → +OH 10% +Contingency 5% +VAT 7% = **Grand Total ฿1,451,769** ≈ **฿7,259/m²** (footprint 200 m²). Material:Labour ≈ 61:39.
- Full line items, units, quantities, rates, and per-division material fractions are in the file's logic class (`data` array + `matFrac` map). Treat these as **structured data** — port them to a data file/table, not hardcoded markup.

### C) Pitch + Feasibility/ROI Deck — `Straw Warehouse Deck.dc.html`
**Purpose:** 9-slide bilingual presentation. 1920×1080. Uses a slide-stage shell (keyboard nav, thumbnail rail, speaker notes, print-to-PDF). Slides 1 & 3 contain **image slots** for the user's own 3D renders/photos.

Slides: 1) Title · 2) Problem & Opportunity · 3) The Concept (specs) · 4) Functional Zones (6) · 5) How It Works (5-step flow) · 6) Construction Cost (BOQ summary, ฿1.45M) · 7) Feasibility & ROI (payback ~2.2 yr — **illustrative assumptions, adjust to real prices**) · 8) Benefits (5) · 9) Next Steps. Each `<section>` carries `data-label` and `data-speaker-notes`.

---

## Interactions & Behavior

### 3D model
- **Orbit/zoom:** OrbitControls with damping (factor .08), `maxPolarAngle ≈ 0.495π` (no going under ground), `minDistance 8`, `maxDistance 95`, `autoRotateSpeed .9`.
- **Camera presets** (position → lookAt), smoothly tweened by lerping camera position & controls.target at 0.07/frame until within 0.4 units:
  - Front `[0,9,32] → [0,3,0]` · Side `[34,9,0] → [0,3,0]` · Top `[18,30,18] → [0,0,0]` · Interior `[9,3,1] → [-9,2.2,0]` · default iso `[26,15,24] → [0,2,0]`.
- **Zoom buttons:** scale the camera→target offset by 0.8 (in) / 1.25 (out), clamped 8–90.
- **Rotate 360°:** toggles `controls.autoRotate`.
- **Labels:** 7 zone label pills projected from 3D world positions to screen coords each frame (`vector.project(camera)`, hidden when behind camera or toggled off). Clicking a label or a Key-Zones row selects the zone and updates the info card.
- **Doors/Walls:** each has an animated 0→1 value lerped at 0.12/frame toward a target; doors set leaf `rotation.y = openAngle × value`; side panels set `scale.y = 1 − 0.94 × value` (anchored at top). Defaults: both **open**.
- **Weather:** Sunny↔Rainy swaps `scene.background`/fog color + near/far, dims the sun (1.2→0.35) and hemisphere light, and toggles a **rain particle system** (~1800 `THREE.Points`, falling and recycling each frame).
- **Activity:** forklift `position.x` oscillates between −3 and 7.5 via `sin`, flipping `rotation.y` (0 / π) at direction changes.
- **Dimensions:** toggles a `LineSegments` set (20 m width, 10 m depth, 5.0 m eave, 7.6 m ridge) + 4 projected dimension labels.

### BOQ
- **Print/Save PDF** button → `window.print()`; print CSS hides the button and flattens the sheet.
- All amounts/subtotals/markups/benchmark position are **computed at render** from the data — keep them derived, never hardcode totals.

### Deck
- Arrow keys / click nav via the stage; `deck.goTo(n)` (0-indexed) for programmatic nav. Image slots accept drag-and-drop and persist.

## State Management
- **3D:** `{ view, rotate, labels, selected, doorsOpen, wallsOpen, weather, activity, dims }` plus non-React runtime refs for the Three.js scene/camera/renderer/controls, animation targets (`doorTarget/doorCur`, `wallTarget/wallCur`, `fT` forklift phase, `tweening` + camera target). In react-three-fiber, model these as component state + refs; drive animation in a `useFrame` loop.
- **BOQ:** pure derivation from the `data` array (no async).
- **Deck:** current slide index (owned by the stage).
- No data fetching anywhere — all content is local/static.

## Assets
- **Fonts:** Plus Jakarta Sans (Google Fonts).
- **Icons:** inline SVG (stroke style, 1.6–2px) — house/warehouse, refresh, zoom, tag, door, wall, sun, truck, ruler, check, printer. Re-implement with the codebase's icon set (e.g. lucide-react has close equivalents).
- **3D library:** Three.js r128 + examples/js OrbitControls (port to a maintained version / react-three-fiber + drei OrbitControls).
- **No raster images** are required; the deck's two `image-slot` placeholders are meant to be filled with the user's own 3D screenshots/photos.
- **Emoji** used as lightweight icons on the deck's Benefits/flow slides (🌾📉🚚⚙️💰📍) — optional; swap for real icons if preferred.

## Files
Included in this bundle (design references):
- `Straw Warehouse 3D.dc.html` — interactive 3D concept model (Three.js scene + control-panel UI + projected labels).
- `Straw Warehouse BOQ.dc.html` — bilingual BOQ document (data-driven table, cost charts, references).
- `Straw Warehouse Deck.dc.html` — 9-slide bilingual pitch/feasibility deck.
- `deck-stage.js` — slide-stage web component used by the deck (reference only; replace with your routing/slide solution).
- `image-slot.js` — drag-and-drop image placeholder used by the deck (reference only).

> Note on `.dc.html`: each file has its markup, a `class Component` logic block, and (optionally) a props JSON. Read them as plain HTML + a JS class; the geometry, numbers, colors, copy, and interaction logic are all the source of truth for the rebuild.

## Screenshots
Reference renders are in `screenshots/`:
- `01-3d-isometric.png` — 3D model, default isometric view (open doors/walls, labels on)
- `02-3d-interior.png` — Interior camera preset
- `03-3d-rainy-closed.png` — Top view with rain mode, doors/walls closed, dimension lines on
- `04-boq-top.png` — BOQ header, meta grid, and start of the line-item table
- `05-boq-analysis.png` — BOQ cost-by-division bars, material/labour split, market benchmark
- `06-deck-title.png` — Deck title slide
- `07-deck-zones.png` — Deck: functional zones
- `08-deck-cost.png` — Deck: construction-cost summary
- `09-deck-roi.png` — Deck: feasibility & ROI

(The deck screenshots include the editor's left thumbnail rail — it is not part of the slide; the slide itself is the 16:9 area on the right.)
