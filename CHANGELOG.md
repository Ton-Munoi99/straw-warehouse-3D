# Changelog

บันทึกการเปลี่ยนแปลงของโปรเจกต์ **Rice Straw Storage Warehouse** (โมเดล 3D · BOQ · Feasibility/ROI)
All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); dates are `YYYY-MM-DD`.

Deployed at [straw-warehouse-3d.netlify.app](https://straw-warehouse-3d.netlify.app) ·
Repo: [Ton-Munoi99/straw-warehouse-3D](https://github.com/Ton-Munoi99/straw-warehouse-3D)

## [2026-07-01]

### Changed
- Export UI simplified to a single **Excel (.xlsx)** button on BOQ & Feasibility; the CSV button was removed.

## [2026-06-30]

### Added
- **Excel export** on both the BOQ and Feasibility/ROI pages. Real `.xlsx` via SheetJS
  (Summary / Cash Flow / Scenarios as separate sheets for ROI; one sheet for BOQ),
  loaded on demand so the initial bundle is unaffected. Numbers stay numeric so Excel can re-sum.
- Price Basis table now lists all three sell channels explicitly (biomass 21, cattle 35,
  mushroom 33 ฿/bale) with their reference badges.
- Worked **ROI example** in the methodology modal — per-year net profit → average → ÷ CapEx.
- Transport-cost reference (R6) documenting the 90 ฿/t inbound assumption.

### Changed
- **Simulation** channel price is now edited **per bale (฿/ก้อน)** — how deals are actually
  negotiated — with the per-tonne equivalent shown below.
- Reference Scenarios: the **Base** column now tracks the live Simulation inputs, while
  Conservative/Upside keep their fixed sales assumptions and all three share the current CapEx/tax/discount.
- Sensitivity grid recomputed with the full model (ramp-up, depreciation, tax) so it matches
  the headline payback; the cell nearest the current assumptions is highlighted.
- Simulation number fields: fit-content boxes, hidden spinners, left-aligned values, and
  easier free typing (clearing a field no longer snaps to 0 mid-edit).

### Fixed
- Channel reference line mislabeled a per-tonne value as "per bale".
- Price number was clipped by an over-long unit suffix.

## [2026-06-29]

### Added
- Worked-number ROI walkthrough and an R6 transport-cost source with clickable links.

## [2026-06-25]

### Added
- Cumulative **cash-flow chart** with a break-even marker on the Feasibility page.

### Changed
- Full **mobile-responsive** pass across BOQ, Feasibility & 3D — no horizontal overflow,
  clean proportions, tables scroll within their frames.
- Bilingual TH/EN added to all remaining units, BOQ meta fields, and the footer credit.

### Removed
- The experimental Home landing page and 9-slide Pitch Deck were reverted; the 3D model is the home page again.

## [2026-06-24]

### Added
- **Feasibility / ROI page** — a straw aggregation-hub financial model with NPV, IRR, payback,
  EBITDA, an interactive **Simulation** mode (approval-gated), a methodology modal, and detailed
  clickable references.
- BOQ methodology modal explaining how every line and total is derived, plus per-line rate
  sourcing and an R7 tag for items priced from contractor/market quotes.
- Navigation buttons linking the 3D model, BOQ, and ROI pages.
- SVG brand favicon.

### Changed
- Warehouse resized to **18 × 10 m, 9 m tall** across the 3D model, BOQ, and feasibility.
- Richer 3D environment — realistic forklift pick/place cycle, stake-bed truck, surrounding
  golden paddy fields, and onlookers.
- Soft costs excluded from the BOQ (design/permits/utilities) are now captured in the feasibility CapEx/OpEx.

### Fixed
- All BOQ and Feasibility text made fully bilingual (TH/EN), references made clickable and verified.
- 3D ground z-fighting during orbit; concrete apron added around the warehouse.
- Capacity note now reflects the live throughput while in Simulation mode.

## [2026-06-23]

### Added
- Initial release — interactive **3D warehouse model** (react-three-fiber) and a bilingual
  **Bill of Quantities** document.
