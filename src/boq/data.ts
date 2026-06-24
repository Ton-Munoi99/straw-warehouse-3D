export interface LineItem {
  no: string
  th: string
  en: string
  unit: string
  qty: number
  rate: number
  ref: string
  basis?: string // how the quantity was derived (bilingual)
  rateNote?: string // where the unit rate comes from (which part of the source)
}

export interface Division {
  code: string
  title: string
  items: LineItem[]
}

export const divisions: Division[] = [
  {
    code: 'A',
    title: 'งานเตรียมพื้นที่และงานดิน / Site & Earthwork',
    items: [
      { no: 'A1', th: 'ปรับเกลี่ยและถางพื้นที่', en: 'Site clearing & leveling', unit: 'ตร.ม.', qty: 380, rate: 25, ref: 'R1', basis: 'อาคาร 180 ตร.ม. + ลานทำงานรอบอาคาร ≈ 380 ตร.ม. · building 180 m² + working apron ≈ 380 m²', rateNote: 'TPSO ดัชนีราคาวัสดุก่อสร้าง > หมวดงานดิน/ปรับพื้นที่ · TPSO index, earthwork section' },
      { no: 'A2', th: 'ขุดดินฐานราก', en: 'Excavation for footings', unit: 'ลบ.ม.', qty: 32, rate: 180, ref: 'R1', basis: 'ฐานราก 12 ต้น × ~2.7 ลบ.ม./ฐาน ≈ 32 ลบ.ม. · 12 footings × ~2.7 m³', rateNote: 'TPSO > หมวดงานขุดดิน ~180 ฿/ลบ.ม. · TPSO index, excavation' },
      { no: 'A3', th: 'ถมบดอัดแน่นใต้พื้น', en: 'Compacted fill under slab', unit: 'ลบ.ม.', qty: 110, rate: 220, ref: 'R1', basis: 'พื้นที่ 180 ตร.ม. × ความลึกถม ~0.6 ม. ≈ 110 ลบ.ม. · footprint × ~0.6 m fill', rateNote: 'TPSO > หมวดลูกรัง/ถมบดอัด ~220 ฿/ลบ.ม. · TPSO index, laterite/fill' },
      { no: 'A4', th: 'วางผังและสำรวจ', en: 'Setting out & survey', unit: 'เหมา', qty: 1, rate: 8000, ref: 'R7', basis: 'เหมาจ่ายงานวางผัง-สำรวจ · lump-sum setting-out & survey', rateNote: 'เหมาช่าง/ราคาตลาด — ไม่มีแหล่งอ้างอิงสาธารณะเฉพาะ · contractor lump-sum' },
    ],
  },
  {
    code: 'B',
    title: 'งานคอนกรีตและฐานราก / Concrete & Foundation',
    items: [
      { no: 'B1', th: 'คอนกรีตหยาบรองพื้น', en: 'Lean concrete blinding', unit: 'ลบ.ม.', qty: 6, rate: 2300, ref: 'R2', basis: 'รองก้นฐาน 12 ฐาน หนา ~5 ซม. ≈ 6 ลบ.ม. · blinding under 12 footings', rateNote: 'OBEC บัญชีราคา > คอนกรีตหยาบ (lean) · OBEC schedule, lean concrete' },
      { no: 'B2', th: 'ฐานรากเสา ค.ส.ล. (12 ต้น)', en: 'RC column footings', unit: 'ลบ.ม.', qty: 11, rate: 3000, ref: 'R2', basis: 'ฐานเสา 12 ต้น (เสาสูง 6.4 ม. ฐานใหญ่ขึ้น) ≈ 11 ลบ.ม. · 12 footings, larger for 6.4 m columns', rateNote: 'OBEC > งาน ค.ส.ล.ฐานราก ~3,000 ฿/ลบ.ม. (รวมแบบ+เหล็ก) · OBEC RC footing' },
      { no: 'B3', th: 'พื้นยกระดับ ค.ส.ล. หนา 0.15 ม.', en: 'Raised RC floor slab', unit: 'ลบ.ม.', qty: 27, rate: 2900, ref: 'R2', basis: 'พื้น 19.4 × 11 ม. × หนา 0.15 ม. ≈ 27 ลบ.ม. (สุทธิ) · slab area × 0.15 m', rateNote: 'OBEC > พื้น ค.ส.ล. ~2,900 ฿/ลบ.ม. (อิง คอนกรีต ~1,845) · OBEC RC slab' },
      { no: 'B4', th: 'คานคอดิน / คานขอบ', en: 'Grade & edge beams', unit: 'ลบ.ม.', qty: 7, rate: 3200, ref: 'R2', basis: 'คานรอบรูป 56 ม. + คานภายใน ≈ 7 ลบ.ม. · perimeter 56 m + internal beams', rateNote: 'OBEC > คาน ค.ส.ล. ~3,200 ฿/ลบ.ม. · OBEC RC beam' },
      { no: 'B5', th: 'เหล็กเสริม', en: 'Reinforcement steel', unit: 'กก.', qty: 3600, rate: 32, ref: 'R1', basis: '~110 กก./ลบ.ม. × ปริมาตรคอนกรีต ~33 ลบ.ม. ≈ 3,600 กก. · ~110 kg per m³ concrete', rateNote: 'TPSO > หมวดเหล็กเส้นกลม/ข้ออ้อย ~32 ฿/กก. · TPSO index, rebar' },
      { no: 'B6', th: 'ไม้แบบหล่อคอนกรีต', en: 'Formwork', unit: 'ตร.ม.', qty: 175, rate: 280, ref: 'R7', basis: 'ผิวแบบ ฐาน+คาน+ขอบพื้น ≈ 175 ตร.ม. · formwork contact area', rateNote: 'ราคาตลาดไม้แบบ+ค่าแรง ~280 ฿/ตร.ม. (เหมาช่าง) · market formwork rate' },
    ],
  },
  {
    code: 'C',
    title: 'งานโครงสร้างเหล็ก / Structural Steel',
    items: [
      { no: 'C1', th: 'เสาเหล็ก H-200 (12 ต้น · สูง 6.4 ม.)', en: 'Steel columns H-200 (6.4 m tall)', unit: 'ต้น', qty: 12, rate: 6800, ref: 'R5', basis: 'เสา H-200 12 ต้น สูง 6.4 ม. (ราคา/ต้น = เหล็ก + ทำสี + ติดตั้ง) · 12 columns at the 6 frame lines × 2 sides', rateNote: 'Pebsteel/Easy WH > main frame 2,500–3,500 ฿/ตร.ม. → แปลงเป็น ~6,800 ฿/ต้น (เสาสูง 6.4 ม.) · converted from per-m² steel-frame price' },
      { no: 'C2', th: 'โครงหลังคาเหล็ก (จันทัน)', en: 'Steel roof trusses', unit: 'ชุด', qty: 6, rate: 9500, ref: 'R5', basis: 'โครงจั่ว 6 เฟรม (ช่วงลึก 10 ม.) · 1 truss per frame line × 6', rateNote: 'Pebsteel > main frame → แปลงเป็น ~9,500 ฿/ชุดโครงจั่ว · per-truss from per-m² frame price' },
      { no: 'C3', th: 'แปและค้ำยันกันลม', en: 'Purlins & wind bracing', unit: 'กก.', qty: 1150, rate: 48, ref: 'R5', basis: 'แป+ค้ำยันกันลม หลังคา 18×10 ม. ≈ 1,150 กก. · purlins & bracing for 18×10 m roof', rateNote: 'Pebsteel/ราคาเหล็กรูปพรรณ ~48 ฿/กก. · light-gauge steel ~48 ฿/kg' },
      { no: 'C4', th: 'แผ่นเหล็กฐานและสมอยึด', en: 'Base plates & anchor bolts', unit: 'ชุด', qty: 12, rate: 950, ref: 'R7', basis: 'แผ่นฐาน+สมอยึด 1 ชุด/เสา × 12 · 1 set per column × 12', rateNote: 'ราคาตลาดแผ่นฐาน+สมอยึด ~950 ฿/ชุด (เหมาช่าง) · market base-plate set' },
      { no: 'C5', th: 'สีกันสนิมและสีทับหน้า', en: 'Anti-rust primer & paint', unit: 'ตร.ม.', qty: 420, rate: 85, ref: 'R7', basis: 'พื้นที่ผิวเหล็ก (เสาสูง + โครงหลังคา) ≈ 420 ตร.ม. · steel surface area', rateNote: 'ราคาตลาดงานสีกันสนิม+ทับหน้า ~85 ฿/ตร.ม. (เหมาช่าง) · market painting rate' },
    ],
  },
  {
    code: 'D',
    title: 'งานหลังคาและกันฝน / Roofing & Rain Protection',
    items: [
      { no: 'D1', th: 'หลังคาเมทัลชีท หนา 0.47 มม.', en: 'Metal sheet roofing 0.47mm', unit: 'ตร.ม.', qty: 256, rate: 380, ref: 'R3', basis: 'หลังคา 2 ลาด (กว้าง 21 ม. × ยาวลาด ~6.1 ม. × 2) ≈ 256 ตร.ม. · two slopes incl. overhang', rateNote: 'แสงไทยเมทัลชีท > หน้าราคาหลังคาเมทัลชีท 0.47 มม. 370–430 → 380 ฿/ตร.ม. · Sangthai roofing price page' },
      { no: 'D2', th: 'ฉนวนพียู ใต้หลังคา', en: 'PU insulation under roof', unit: 'ตร.ม.', qty: 256, rate: 150, ref: 'R4', basis: 'ใต้หลังคา = พื้นที่หลังคา 256 ตร.ม. · same as roof area', rateNote: 'KS Group > หน้าราคาฉนวนพียู (PU/PE) ~150 ฿/ตร.ม. · KS insulation page' },
      { no: 'D3', th: 'ครอบสันและแผ่นปิดรอยต่อ', en: 'Ridge cap & flashing', unit: 'ม.', qty: 22, rate: 180, ref: 'R3', basis: 'ครอบสัน ~21 ม. + แผ่นปิดรอยต่อหน้าจั่ว ≈ 22 ม. · ridge ~21 m + gable flashing', rateNote: 'แสงไทยเมทัลชีท > อุปกรณ์ครอบ/ปิดรอยต่อ ~180 ฿/ม. · Sangthai accessories' },
      { no: 'D4', th: 'รางน้ำฝน', en: 'Gutters', unit: 'ม.', qty: 40, rate: 280, ref: 'R7', basis: 'รางน้ำ 2 ชายคา × ~18.6 ม. ≈ 40 ม. · 2 eaves × ~18.6 m', rateNote: 'ราคาตลาดรางน้ำเมทัลชีท ~280 ฿/ม. (เหมาช่าง) · market gutter rate' },
      { no: 'D5', th: 'ท่อระบายน้ำฝน', en: 'Downpipes', unit: 'ม.', qty: 28, rate: 220, ref: 'R7', basis: 'ท่อลง 4 มุม × สูง ~7 ม. (ชายคา 7 ม.) ≈ 28 ม. · 4 corners × ~7 m eave height', rateNote: 'ราคาตลาดท่อ PVC/เมทัล ~220 ฿/ม. (เหมาช่าง) · market downpipe rate' },
    ],
  },
  {
    code: 'E',
    title: 'งานระบบระบายน้ำ / Drainage',
    items: [
      { no: 'E1', th: 'รางระบายน้ำ ค.ส.ล. รอบอาคาร', en: 'Perimeter RC drainage channel', unit: 'ม.', qty: 56, rate: 650, ref: 'R2', basis: 'รอบอาคาร = เส้นรอบรูป (18+10)×2 = 56 ม. · building perimeter (18+10)×2', rateNote: 'OBEC > งานราง ค.ส.ล. ~650 ฿/ม. · OBEC RC channel' },
      { no: 'E2', th: 'ฝาปิด / ตะแกรงราง', en: 'Channel cover / grating', unit: 'ม.', qty: 56, rate: 220, ref: 'R7', basis: 'ฝาปิด = ความยาวราง 56 ม. · matches channel length', rateNote: 'ราคาตลาดฝา/ตะแกรงเหล็ก ~220 ฿/ม. (เหมาช่าง) · market grating rate' },
      { no: 'E3', th: 'จุดเชื่อมต่อลงคลองชลประทาน', en: 'Outlet connection to canal', unit: 'เหมา', qty: 1, rate: 12000, ref: 'R7', basis: 'จุดต่อระบายลงคลอง เหมารวม · lump-sum canal outlet', rateNote: 'เหมาช่าง — งานจุดต่อระบาย · contractor lump-sum' },
    ],
  },
  {
    code: 'F',
    title: 'งานถนนและลานจอด / Access Road & Apron',
    items: [
      { no: 'F1', th: 'ถนนลูกรังบดอัด', en: 'Compacted laterite road', unit: 'ตร.ม.', qty: 200, rate: 280, ref: 'R1', basis: 'ถนนเข้าไซต์ ~50 ม. × กว้าง 4 ม. ≈ 200 ตร.ม. · access road ~50 m × 4 m', rateNote: 'TPSO > หมวดลูกรัง/หินคลุก ~280 ฿/ตร.ม. (รวมบดอัด) · TPSO laterite section' },
      { no: 'F2', th: 'ลานคอนกรีตและทางลาดขนถ่าย', en: 'Concrete apron & loading ramp', unit: 'ตร.ม.', qty: 60, rate: 1200, ref: 'R2', basis: 'ลานหน้าประตู + ทางลาดขนถ่าย ≈ 60 ตร.ม. · front apron + loading ramp', rateNote: 'OBEC > พื้น ค.ส.ล.วางบนดิน ~1,200 ฿/ตร.ม. · OBEC slab-on-grade' },
    ],
  },
  {
    code: 'G',
    title: 'งานระบบและเบ็ดเตล็ด / Services & Miscellaneous',
    items: [
      { no: 'G1', th: 'ระบบไฟส่องสว่าง LED (high-bay สำหรับเพดานสูง)', en: 'LED high-bay lighting (tall ceiling)', unit: 'เหมา', qty: 1, rate: 38000, ref: 'R7', basis: 'โคมไฮเบย์สำหรับเพดานสูง 9 ม. + เดินสายภายใน เหมารวม · high-bay fixtures for 9 m ceiling + wiring', rateNote: 'ราคาตลาดโคม LED high-bay + งานเดินสาย (เหมา) · market high-bay + wiring package' },
      { no: 'G2', th: 'อุปกรณ์ความปลอดภัยและดับเพลิง', en: 'Safety & fire equipment', unit: 'เหมา', qty: 1, rate: 18000, ref: 'R7', basis: 'ถังดับเพลิง ป้ายหนีไฟ อุปกรณ์ความปลอดภัย เหมารวม · extinguishers, signage, safety kit', rateNote: 'ราคาตลาดถังดับเพลิง/อุปกรณ์ (เหมา) · market safety/fire kit' },
      { no: 'G3', th: 'ป้ายและการแบ่งโซน', en: 'Signage & zone marking', unit: 'เหมา', qty: 1, rate: 6000, ref: 'R7', basis: 'ป้ายโครงการ + ตีเส้นแบ่งโซน เหมารวม · project sign + zone line-marking', rateNote: 'ราคาตลาดป้าย + งานตีเส้น (เหมา) · market signage & line-marking' },
    ],
  },
  {
    code: 'H',
    title: 'งานผนังและประตูเปิด-ปิด / Walls & Openable Doors',
    items: [
      { no: 'H1', th: 'ประตูเหล็กบานเปิดคู่ หน้าโรงเรือน สูง 5.5 ม. (พร้อมวงกบ)', en: 'Front steel double swing doors, 5.5 m tall (incl. frame)', unit: 'ชุด', qty: 1, rate: 65000, ref: 'R5', basis: 'ประตูบานเปิดคู่เต็มหน้าจั่ว สูง 5.5 ม. 1 ชุด · 1 full-gable double-leaf door set', rateNote: 'ราคาช่างเหล็ก/Pebsteel — ประตูเหล็กบานใหญ่ (เหมา/ชุด) · steel fabricator quote' },
      { no: 'H2', th: 'ผนังเมทัลชีทด้านข้างแบบม้วนเปิด-ปิด สูง 6.0 ม. พร้อมรางและแกนม้วน', en: 'Roll-up metal-sheet side walls, 6.0 m tall (incl. track & drum)', unit: 'ชุด', qty: 10, rate: 16500, ref: 'R3', basis: 'ผนังม้วน 5 ช่อง/ด้าน × 2 ด้าน = 10 ชุด สูง 6.0 ม. · 5 bays per side × 2 sides', rateNote: 'แสงไทยเมทัลชีท (แผ่นผนัง) + ราคาตลาดราง/แกนม้วน → ~16,500 ฿/ชุด · sheet ref + market track/drum' },
      { no: 'H3', th: 'อุปกรณ์ยึด รางเลื่อน และงานติดตั้ง', en: 'Hardware, tracks & installation', unit: 'เหมา', qty: 1, rate: 18000, ref: 'R7', basis: 'รางเลื่อน อุปกรณ์ยึด งานติดตั้ง เหมารวม · tracks, hardware & install', rateNote: 'ราคาตลาดราง/อุปกรณ์ + ค่าติดตั้ง (เหมา) · market hardware & installation' },
    ],
  },
]

export const matFrac: Record<string, number> = {
  A: 0.35, B: 0.60, C: 0.70, D: 0.65, E: 0.55, F: 0.50, G: 0.70, H: 0.65,
}

export const FOOTPRINT_SQM = 180
export const OH_RATE = 0.10
export const CONT_RATE = 0.05
export const VAT_RATE = 0.07
export const BENCH_MIN = 5500
export const BENCH_MAX = 9000

export const PALETTE = [
  '#2f6b3f', '#3f7fae', '#c8902f', '#7a6cc4',
  '#5aa17a', '#c25b46', '#9a7b4f', '#6a8caf',
]

export const REFERENCES = [
  { id: 'R1', text: 'สำนักงานนโยบายและยุทธศาสตร์การค้า (สนค.) กระทรวงพาณิชย์ — ราคาวัสดุก่อสร้างรายจังหวัด 2568 · ดูในตารางดัชนีราคาวัสดุ แยกหมวด: เหล็กเส้น, ลูกรัง/หินคลุก, งานดิน · Office of Trade Policy & Strategy (TPSO) — provincial material-price index; look up by category: rebar, laterite, earthwork', url: 'index.tpso.go.th/construction-material-prices' },
  { id: 'R2', text: 'บัญชีราคาค่าวัสดุก่อสร้างและค่าแรงงาน ปีงบประมาณ 2568 (สพฐ./ยธ.) — คอนกรีตผสมเสร็จ ~1,845 บาท/ลบ.ม.; ดูบัญชีราคามาตรฐานงาน ค.ส.ล. (ฐานราก/พื้น/คาน/ราง) · OBEC FY2025 price schedule — ready-mix ~1,845 THB/m³; see standard RC works (footing/slab/beam/channel)', url: 'yotathai.com/yotanews/obec2568' },
  { id: 'R3', text: 'แสงไทยเมทัลชีท (2568) — หน้าราคาหลังคาเมทัลชีท 0.47 มม. 370–430 บาท/ตร.ม. และอุปกรณ์ครอบสัน/แผ่นผนัง · Sangthai Metal Sheet — roofing-price page (0.47 mm, 370–430 THB/m²) + ridge/wall accessories', url: 'sangthaimetalsheet.com' },
  { id: 'R4', text: 'KS Group Metal Sheet — หน้าราคาฉนวน/เมทัลชีท: ฉนวนพียู ~150 บาท/ตร.ม., เมทัลชีท 200–400 บาท/ตร.ม. · KS Group — insulation & sheet price page: PU ~150 THB/m², sheet 200–400 THB/m²', url: 'ksgroup-metalsheet.com' },
  { id: 'R5', text: 'Pebsteel TH / Easy Warehouse — หน้าราคาต่อ ตร.ม. โครงสร้างเหล็ก main frame 2,500–3,500 บาท/ตร.ม. (นำมาแปลงเป็นราคา/ต้น, /ชุด) · ราคารวมก่อสร้างโกดัง 5,500–9,000 บาท/ตร.ม. · Steel main-frame per-m² page (converted to per-column / per-set)', url: 'th.pebsteel.com · easywarehouse-thailand.com' },
  { id: 'R6', text: 'มูลนิธิประเมินค่า-นายหน้าแห่งประเทศไทย — ราคาประเมินค่าก่อสร้างอาคาร (อ้างอิงเทียบเคียง) · Thai Appraisal Foundation — building construction cost appraisal (comparative reference)', url: 'thaiappraisal.org' },
  { id: 'R7', text: 'ราคาเหมาช่าง / ราคาตลาดทั่วไป (ผู้รับเหมาท้องถิ่น) — สำหรับรายการที่ไม่มีแหล่งอ้างอิงสาธารณะเฉพาะ เช่น ไม้แบบ, งานสี, รางน้ำ-ท่อ, ฝาราง, ระบบไฟ-ดับเพลิง-ป้าย, อุปกรณ์ติดตั้ง ฯลฯ — ควรขอใบเสนอราคาจริง · General contractor & market quotes for items with no specific public source (formwork, painting, gutters/pipes, grating, lighting/fire/signage, hardware/install) — obtain real quotations', url: '— ขอใบเสนอราคาผู้รับเหมาในพื้นที่ / request local contractor quotes' },
]

export const META = [
  { label: 'โครงการ / Project', value: 'ศูนย์รวบรวมฟางข้าว' },
  { label: 'สถานที่ / Location', value: 'พื้นที่นาข้าว ชนบท' },
  { label: 'ขนาดอาคาร / Footprint', value: '18 × 10 m (180 m²)' },
  { label: 'โครงสร้าง / Structure', value: 'เหล็ก สูง 9 ม. ผนังเปิด-ปิดได้ จั่ว' },
]

export const NOTES = [
  'ราคาเป็นการประมาณการเบื้องต้นสำหรับศึกษาความเป็นไปได้ · Preliminary, feasibility-stage estimate.',
  'ราคาวัสดุและค่าแรงอ้างอิงตลาดชนบทไทย อาจเปลี่ยนแปลงตามพื้นที่และช่วงเวลา · Material & labour rates reference rural Thai market; may vary by area and timing.',
  'ไม่รวมค่าที่ดิน, ค่าออกแบบ/ขออนุญาต, ระบบไฟฟ้าแรงสูง และงานน้ำประปา (BOQ = งานก่อสร้างจริงเท่านั้น) — รายการเหล่านี้ถูกนำไปคิดในหน้า Feasibility แล้ว: ที่ดิน = ค่าเช่าใน OpEx, ค่าออกแบบ/ขออนุญาต+เชื่อมไฟฟ้า-ประปา = soft-cost ใน CapEx · Excludes land, design/permit fees, HV electrical & water supply (a BOQ covers physical works only) — these ARE captured in the Feasibility: land as an OpEx lease, design/permit + utility hook-ups as a CapEx soft-cost line.',
  'การออกแบบฐานรากสำหรับดินแข็ง ไม่รวมเสาเข็ม · Foundation sizing assumes firm soil; pile foundation not included.',
]
