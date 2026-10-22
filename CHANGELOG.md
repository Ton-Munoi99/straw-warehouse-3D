# Changelog · บันทึกการเปลี่ยนแปลง

บันทึกการเปลี่ยนแปลงของโปรเจกต์ **Rice Straw Storage Warehouse** (โมเดล 3D · BOQ · Feasibility/ROI) ·
All notable changes to the project are documented here.

รูปแบบอ้างอิง [Keep a Changelog](https://keepachangelog.com/) และเวอร์ชันแบบ [Semantic Versioning](https://semver.org/) · วันที่เป็น `YYYY-MM-DD` ·
Format based on Keep a Changelog; versions follow Semantic Versioning; dates are `YYYY-MM-DD`.

เผยแพร่ที่ / Deployed at [straw-warehouse-3d.netlify.app](https://straw-warehouse-3d.netlify.app) ·
โค้ด / Repo: [Ton-Munoi99/straw-warehouse-3D](https://github.com/Ton-Munoi99/straw-warehouse-3D)

## [1.3.0] — 2026-10-22

### เพิ่ม / Added
- **ทางเลือกเมื่อโกดังเล็กกว่าแผนขาย** ในหน้า ROI — ตารางเทียบแผนปัจจุบันกับ 3 แนวทางที่สมเหตุสมผล (ขายผ่านเร็วแต่ไม่ได้ราคาหน้าแล้ง / ขยายโกดังเก็บได้ 1 เดือน / ลดยอดขายให้พอดีโกดัง) พร้อมป้ายคุ้ม/ไม่คุ้ม และ 2 ทางที่ทำให้ตัวเลขเป็นจริงได้ (ที่เก็บแบบถูกไม่เกิน ~฿3,240/ตร.ม. หรือสัญญาขายล่วงหน้า + ยอดขายขั้นต่ำ ~1,730 ตัน/ปี) คำนวณสดจากค่าที่กรอก · **Capacity options** on the ROI page — the current plan vs three consistent alternatives with a pays-back badge, plus two ways to make it work (cheap storage ≤ ~฿3,240/m², or a forward offtake contract with ≥ ~1,730 t/yr), all recomputed live.

### เปลี่ยน / Changed
- กล่องเตือนความจุด้านบนเหลือบรรทัดเดียว พร้อมลิงก์ไปยังตารางทางเลือก · The capacity warning under the headline metrics is now a single line linking to the options.

## [1.2.1] — 2026-10-22

### เปลี่ยน / Changed
- ทัวร์นำชมเร็วขึ้นและลื่นขึ้น — จาก ~59 วินาทีเหลือ ~33 วินาที กล้องเคลื่อนแบบค่อยๆ เร่งและค่อยๆ เบรก (1.4 วินาทีต่อการเคลื่อน ไม่ขึ้นกับเฟรมเรต) หยุดดูแต่ละจุด 2.6 วินาทีหลังกล้องจอด และบินกลับภาพรวมตอนจบโดยไม่ต้องรออีกรอบ ปุ่มมุมกล้องก็เคลื่อนแบบเดียวกัน · Guided tour is faster and smoother — ~59 s → ~33 s; every camera move now takes a fixed 1.4 s with ease-in-out (frame-rate independent), each stop holds 2.6 s after arriving, and the tour flies home at the end instead of a second overview stop. View buttons use the same easing.

## [1.2.0] — 2026-10-22

### เพิ่ม / Added
- **ความจุโกดัง vs ปริมาณขาย** — คำนวณความจุจากผังกองฟางจริงในภาพ 3D (14 × 11 ก้อน ซ้อนได้ 14 ชั้น ≈ 5.1 ม. = 2,156 ก้อน ≈ 43 ตัน) หน้า ROI แสดงจำนวนรอบหมุนสต๊อกต่อปีและจำนวนวันที่ฟางอยู่ในโกดัง พร้อมเตือนเมื่อหมุนเร็วกว่าเดือนละรอบ (กรณีฐาน ~46 รอบ/ปี ≈ 8 วัน คือเป็นจุดพักสินค้า ไม่ใช่โกดังเก็บข้ามฤดู) · **Storage capacity vs throughput** — capacity is computed from the actual 3D stack layout (14 × 11 bales × 14 layers ≈ 5.1 m = 2,156 bales ≈ 43 t); the ROI page shows stock turns per year and average dwell days, warning when stock turns faster than monthly (base case ≈ 46 turns/yr, ≈ 8 days — a flow-through hub rather than seasonal storage).
- แถบเลื่อน **Storage Fill** ในหน้า 3D ปรับจำนวนชั้นของกองฟาง (0–14) พร้อมบอกจำนวนก้อน ตัน และ % ของความจุ · **Storage Fill** slider on the 3D page (0–14 layers) with bales / tonnes / % of capacity.
- **ทัวร์นำชมอัตโนมัติ** 9 จุด ตามเส้นทางฟาง (ถนน → จุดขนถ่าย → ทางเดิน → กองฟาง → ผนังเปิด → หลังคา → ทางระบายน้ำ) พร้อมคำบรรยาย ปุ่มย้อน/ถัดไป/หยุด · **Guided tour** — 9 camera stops along the straw's path with captions and prev/next/stop.
- **ช่วงเวลาของวัน** เช้า / เที่ยง / เย็น — ตำแหน่งแดด สีแสง ท้องฟ้า และหมอกเปลี่ยนตาม (ตอนฝนตกใช้แสงฝนแทน) · **Time of day** — morning / noon / evening lighting presets (rain overrides).
- **อัดวิดีโอหมุน 360°** เป็นไฟล์ MP4 (หรือ WebM ถ้าเบราว์เซอร์ไม่รองรับ) หยุดเองเมื่อครบหนึ่งรอบพอดี · **Record a 360° video** — MP4 (or WebM) that stops after exactly one full orbit.

### เปลี่ยน / Changed
- อุปกรณ์จอสัมผัส (มือถือ/แท็บเล็ต) ปิดเอฟเฟกต์ AO และ bloom ที่ใช้การ์ดจอหนัก ภาพยังสีเดียวกับบน desktop · Touch devices skip the GPU-heavy AO and bloom passes while keeping the same colours.

## [1.1.0] — 2026-10-22

### เพิ่ม / Added
- **โมเดลเงินกู้ (มุมมองธนาคาร)** ในหน้า Feasibility — วงเงินกู้ ค่างวด DSCR รายปี และ IRR ส่วนทุน (levered) พร้อมกล่องเตือนปีที่ DSCR ต่ำกว่า 1.20 เท่า · ปรับสัดส่วนกู้ ดอกเบี้ย ระยะกู้ และระยะปลอดเงินต้นได้ใน Simulation · เพิ่มขั้น ⑮–⑰ ในหน้าต่างวิธีคำนวณ และชีต Debt ในไฟล์ Excel · **Debt financing (bank view)** on the Feasibility page — loan, annual payment, yearly DSCR and levered equity IRR, with a warning for years below 1.20×; loan %, rate, term and grace period are editable in Simulation; methodology steps ⑮–⑰ and a Debt sheet in the Excel export.
- **ปุ่มถ่ายภาพ 3D** — บันทึกมุมที่หมุนไว้เป็นไฟล์ PNG · **3D snapshot button** — saves the current view as a PNG.
- **ไฟล์ Concept PDF** เปิดได้จากปุ่ม PDF ในหน้า 3D (`/3d-concept.pdf`) · **Concept PDF** served from the site, linked by a PDF button on the 3D page.
- ภาพ 3D: เงาตามซอกมุม (ambient occlusion) แสงฟุ้งจุดสว่าง (bloom) และ vignette · 3D post-processing: ambient occlusion, bloom and vignette.

### เปลี่ยน / Changed
- ภาพ 3D สมจริงขึ้น — ท้องฟ้าไล่สีที่ใช้เป็นแสงสะท้อน (image-based lighting) ด้วย ทำให้หลังคาเหล็กสะท้อนฟ้า คอนทราสต์และเงาชัดขึ้น พุ่มไม้โค้งนุ่ม ลานดินสีธรรมชาติ รวมถึง texture พื้นผิว แถวต้นข้าว และฟอนต์ Noto Sans Thai · More realistic 3D — gradient sky that also lights the scene, so metal reflects the sky; stronger contrast and shadows, smooth tree canopies, natural earth tones, plus surface textures, rice rows and the Noto Sans Thai font.

### แก้ไข / Fixed
- หัวกระดาษหน้า Feasibility และ BOQ บนมือถือ ข้อความมุมขวา (สถานที่/ปี, เลขที่เอกสาร) ถูกตัดหาย — ตอนนี้ตกลงมาอยู่ใต้ชื่อ · On phones the right-hand header block (location/year, doc no.) was clipped on the Feasibility and BOQ pages; it now wraps below the title.

## [1.0.0] — 2026-07-01

รุ่นเสถียรพร้อมนำเสนอ · Stable, presentation-ready release.

### เปลี่ยน / Changed
- ปุ่ม export เหลือ **Excel (.xlsx)** ปุ่มเดียวในหน้า BOQ และ Feasibility (ตัดปุ่ม CSV ออก) · Export UI simplified to a single **Excel (.xlsx)** button on BOQ & Feasibility; the CSV button was removed.

### เอกสาร / Docs
- เพิ่ม `CHANGELOG.md` (สองภาษา ไทย/อังกฤษ) สร้างจากประวัติ git จริง · Added a bilingual `CHANGELOG.md` reconstructed from the git history.

## [0.5.0] — 2026-06-30

### เพิ่ม / Added
- **ส่งออก Excel** ในหน้า BOQ และ Feasibility/ROI — ไฟล์ `.xlsx` จริงด้วย SheetJS (ROI แยกเป็นชีต Summary / Cash Flow / Scenarios · BOQ ชีตเดียว) โหลด library แบบ on-demand จึงไม่ทำให้ bundle หลักอืด และตัวเลขเป็น numeric ที่ Excel นำไปคำนวณต่อได้ · **Excel export** on BOQ and Feasibility/ROI — real `.xlsx` via SheetJS (ROI split into Summary / Cash Flow / Scenarios sheets; BOQ one sheet), the library loads on demand so the initial bundle is unaffected, and numbers stay numeric for re-summing.
- ตาราง Price Basis แสดงครบทั้ง 3 ช่องทางขาย (ชีวมวล 21 · อาหารสัตว์ 35 · เพาะเห็ด 33 ฿/ก้อน) พร้อม badge อ้างอิง · Price Basis table now lists all three sell channels (biomass 21, cattle 35, mushroom 33 ฿/bale) with reference badges.
- ตัวอย่างคำนวณ **ROI** ในหน้าต่างวิธีคำนวณ — กำไรสุทธิรายปี → เฉลี่ย → ÷ CapEx · Worked **ROI example** in the methodology modal — per-year net profit → average → ÷ CapEx.

### เปลี่ยน / Changed
- ช่องราคาใน **Simulation** ปรับเป็น **ต่อก้อน (฿/ก้อน)** ตามที่คุยกันจริง โดยแสดงค่าเทียบเท่าต่อตันไว้ด้านล่าง · **Simulation** channel price is now edited **per bale (฿/ก้อน)** — how deals are negotiated — with the per-tonne equivalent shown below.
- ตาราง Reference Scenarios: คอลัมน์ **Base** อัปเดตตามค่าที่กรอกใน Simulation ส่วน Conservative/Upside คงสมมติฐานการขายของตัวเอง และทั้ง 3 คอลัมน์ใช้ CapEx/ภาษี/discount ปัจจุบันร่วมกัน · Reference Scenarios: the **Base** column tracks live Simulation inputs while Conservative/Upside keep their fixed sales assumptions, and all three share the current CapEx/tax/discount.
- ตาราง Sensitivity คำนวณด้วยโมเดลเต็ม (ramp-up, ค่าเสื่อม, ภาษี) จึงตรงกับระยะคืนทุนด้านบน และเน้นช่องที่ใกล้สมมติฐานปัจจุบัน · Sensitivity grid recomputed with the full model (ramp-up, depreciation, tax) so it matches the headline payback, with the nearest cell highlighted.
- ช่องกรอกตัวเลขใน Simulation: กล่องพอดีเนื้อหา ซ่อนลูกศร spinner ตัวเลขชิดซ้าย และพิมพ์ได้ลื่น (ลบจนว่างไม่เด้งเป็น 0) · Simulation number fields: fit-content boxes, hidden spinners, left-aligned values, and smoother typing (clearing a field no longer snaps to 0).

### แก้ไข / Fixed
- บรรทัดอ้างอิงของช่องทางขาย ติดป้ายค่า "ต่อตัน" ว่าเป็น "ต่อก้อน" ผิด · Channel reference line mislabeled a per-tonne value as "per bale".
- ตัวเลขราคาถูกบังเพราะหน่วยต่อท้ายยาวเกิน · Price number was clipped by an over-long unit suffix.

## [0.4.0] — 2026-06-29

### เพิ่ม / Added
- ตัวอย่างคำนวณ ROI แบบละเอียด และแหล่งอ้างอิงค่าขนส่ง (R6) พร้อมลิงก์กดได้ · Worked ROI walkthrough and an R6 transport-cost source with clickable links.

## [0.3.0] — 2026-06-25

### เพิ่ม / Added
- กราฟ **กระแสเงินสดสะสม** พร้อมจุดคืนทุนในหน้า Feasibility · Cumulative **cash-flow chart** with a break-even marker on the Feasibility page.

### เปลี่ยน / Changed
- ปรับทั้งเว็บให้ **รองรับมือถือ** ครบ (BOQ · Feasibility · 3D) — ไม่ล้นแนวนอน สัดส่วนสวย ตารางเลื่อนในกรอบ · Full **mobile-responsive** pass across BOQ, Feasibility & 3D — no horizontal overflow, clean proportions, tables scroll within their frames.
- เติมภาษาอังกฤษให้หน่วยที่เหลือ ช่อง meta ของ BOQ และเครดิตท้ายหน้า · Added English to the remaining units, BOQ meta fields, and the footer credit.

### นำออก / Removed
- ถอดหน้า Home และ Pitch Deck 9 สไลด์ที่ทดลองไว้ กลับมาใช้หน้า 3D เป็นหน้าแรก · Reverted the experimental Home landing page and 9-slide Pitch Deck; the 3D model is the home page again.

## [0.2.0] — 2026-06-24

### เพิ่ม / Added
- **หน้า Feasibility / ROI** — แบบจำลองการเงินศูนย์รวบรวมฟาง มี NPV, IRR, ระยะคืนทุน, EBITDA, โหมด **Simulation** (ต้องกดอนุมัติก่อน), หน้าต่างวิธีคำนวณ และแหล่งอ้างอิงที่กดได้ · **Feasibility / ROI page** — a straw aggregation-hub financial model with NPV, IRR, payback, EBITDA, an approval-gated **Simulation** mode, a methodology modal, and clickable references.
- หน้าต่างวิธีคำนวณ BOQ อธิบายที่มาของทุกบรรทัดและยอดรวม พร้อมที่มาของราคาต่อรายการ และป้าย R7 สำหรับรายการที่อิงราคาเหมาช่าง/ตลาด · BOQ methodology modal explaining how every line and total is derived, with per-line rate sourcing and an R7 tag for contractor/market-quoted items.
- ปุ่มนำทางเชื่อมหน้า 3D · BOQ · ROI · Navigation buttons linking the 3D model, BOQ, and ROI pages.
- favicon โลโก้แบรนด์ (SVG) · SVG brand favicon.

### เปลี่ยน / Changed
- ปรับขนาดโรงเรือนเป็น **18 × 10 ม. สูง 9 ม.** ทั้งใน 3D, BOQ และ feasibility · Warehouse resized to **18 × 10 m, 9 m tall** across the 3D model, BOQ, and feasibility.
- สภาพแวดล้อม 3D สมจริงขึ้น — วงจรโฟล์คลิฟต์หยิบ/วาง รถบรรทุกกระบะไม้ ทุ่งนาสีทองโดยรอบ และคนยืนดู · Richer 3D environment — realistic forklift pick/place cycle, stake-bed truck, surrounding golden paddy fields, and onlookers.
- ค่าที่ไม่อยู่ใน BOQ (ออกแบบ/ขออนุญาต/สาธารณูปโภค) ถูกนำไปคิดใน CapEx/OpEx ของ feasibility · Soft costs excluded from the BOQ (design/permits/utilities) are now captured in the feasibility CapEx/OpEx.

### แก้ไข / Fixed
- ทำข้อความ BOQ และ Feasibility ให้สองภาษาครบ และทำลิงก์อ้างอิงให้กดได้ + ตรวจสอบแล้ว · Made all BOQ and Feasibility text fully bilingual and references clickable and verified.
- แก้พื้น 3D กระพริบ (z-fighting) ตอนหมุน และเพิ่มลานคอนกรีตรอบอาคาร · Fixed 3D ground z-fighting during orbit and added a concrete apron around the warehouse.
- หมายเหตุความจุแสดงค่าปริมาณจริงตอนอยู่ในโหมด Simulation · Capacity note now reflects the live throughput in Simulation mode.

## [0.1.0] — 2026-06-23

### เพิ่ม / Added
- รุ่นแรก — **โมเดลโรงเรือน 3D** โต้ตอบได้ (react-three-fiber) และเอกสาร **บัญชีปริมาณงาน (BOQ)** สองภาษา · Initial release — interactive **3D warehouse model** (react-three-fiber) and a bilingual **Bill of Quantities** document.
