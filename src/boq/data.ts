export interface LineItem {
  no: string
  th: string
  en: string
  unit: string
  qty: number
  rate: number
  ref: string
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
      { no: 'A1', th: 'ปรับเกลี่ยและถางพื้นที่', en: 'Site clearing & leveling', unit: 'ตร.ม.', qty: 400, rate: 25, ref: 'R1' },
      { no: 'A2', th: 'ขุดดินฐานราก', en: 'Excavation for footings', unit: 'ลบ.ม.', qty: 30, rate: 180, ref: 'R1' },
      { no: 'A3', th: 'ถมบดอัดแน่นใต้พื้น', en: 'Compacted fill under slab', unit: 'ลบ.ม.', qty: 120, rate: 220, ref: 'R1' },
      { no: 'A4', th: 'วางผังและสำรวจ', en: 'Setting out & survey', unit: 'เหมา', qty: 1, rate: 8000, ref: '' },
    ],
  },
  {
    code: 'B',
    title: 'งานคอนกรีตและฐานราก / Concrete & Foundation',
    items: [
      { no: 'B1', th: 'คอนกรีตหยาบรองพื้น', en: 'Lean concrete blinding', unit: 'ลบ.ม.', qty: 6, rate: 2300, ref: 'R2' },
      { no: 'B2', th: 'ฐานรากเสา ค.ส.ล. (12 ต้น)', en: 'RC column footings', unit: 'ลบ.ม.', qty: 9, rate: 3000, ref: 'R2' },
      { no: 'B3', th: 'พื้นยกระดับ ค.ส.ล. หนา 0.15 ม.', en: 'Raised RC floor slab', unit: 'ลบ.ม.', qty: 30, rate: 2900, ref: 'R2' },
      { no: 'B4', th: 'คานคอดิน / คานขอบ', en: 'Grade & edge beams', unit: 'ลบ.ม.', qty: 8, rate: 3200, ref: 'R2' },
      { no: 'B5', th: 'เหล็กเสริม', en: 'Reinforcement steel', unit: 'กก.', qty: 3500, rate: 32, ref: 'R1' },
      { no: 'B6', th: 'ไม้แบบหล่อคอนกรีต', en: 'Formwork', unit: 'ตร.ม.', qty: 180, rate: 280, ref: '' },
    ],
  },
  {
    code: 'C',
    title: 'งานโครงสร้างเหล็ก / Structural Steel',
    items: [
      { no: 'C1', th: 'เสาเหล็ก H-150 (12 ต้น)', en: 'Steel columns H-150', unit: 'ต้น', qty: 12, rate: 4800, ref: 'R5' },
      { no: 'C2', th: 'โครงหลังคาเหล็ก (จันทัน)', en: 'Steel roof trusses', unit: 'ชุด', qty: 6, rate: 9500, ref: 'R5' },
      { no: 'C3', th: 'แปและค้ำยันกันลม', en: 'Purlins & wind bracing', unit: 'กก.', qty: 1200, rate: 48, ref: 'R5' },
      { no: 'C4', th: 'แผ่นเหล็กฐานและสมอยึด', en: 'Base plates & anchor bolts', unit: 'ชุด', qty: 12, rate: 850, ref: '' },
      { no: 'C5', th: 'สีกันสนิมและสีทับหน้า', en: 'Anti-rust primer & paint', unit: 'ตร.ม.', qty: 380, rate: 85, ref: '' },
    ],
  },
  {
    code: 'D',
    title: 'งานหลังคาและกันฝน / Roofing & Rain Protection',
    items: [
      { no: 'D1', th: 'หลังคาเมทัลชีท หนา 0.47 มม.', en: 'Metal sheet roofing 0.47mm', unit: 'ตร.ม.', qty: 280, rate: 380, ref: 'R3' },
      { no: 'D2', th: 'ฉนวนพียู ใต้หลังคา', en: 'PU insulation under roof', unit: 'ตร.ม.', qty: 280, rate: 150, ref: 'R4' },
      { no: 'D3', th: 'ครอบสันและแผ่นปิดรอยต่อ', en: 'Ridge cap & flashing', unit: 'ม.', qty: 24, rate: 180, ref: 'R3' },
      { no: 'D4', th: 'รางน้ำฝน', en: 'Gutters', unit: 'ม.', qty: 44, rate: 280, ref: '' },
      { no: 'D5', th: 'ท่อระบายน้ำฝน', en: 'Downpipes', unit: 'ม.', qty: 24, rate: 220, ref: '' },
    ],
  },
  {
    code: 'E',
    title: 'งานระบบระบายน้ำ / Drainage',
    items: [
      { no: 'E1', th: 'รางระบายน้ำ ค.ส.ล. รอบอาคาร', en: 'Perimeter RC drainage channel', unit: 'ม.', qty: 60, rate: 650, ref: 'R2' },
      { no: 'E2', th: 'ฝาปิด / ตะแกรงราง', en: 'Channel cover / grating', unit: 'ม.', qty: 60, rate: 220, ref: '' },
      { no: 'E3', th: 'จุดเชื่อมต่อลงคลองชลประทาน', en: 'Outlet connection to canal', unit: 'เหมา', qty: 1, rate: 12000, ref: '' },
    ],
  },
  {
    code: 'F',
    title: 'งานถนนและลานจอด / Access Road & Apron',
    items: [
      { no: 'F1', th: 'ถนนลูกรังบดอัด', en: 'Compacted laterite road', unit: 'ตร.ม.', qty: 200, rate: 280, ref: 'R1' },
      { no: 'F2', th: 'ลานคอนกรีตและทางลาดขนถ่าย', en: 'Concrete apron & loading ramp', unit: 'ตร.ม.', qty: 60, rate: 1200, ref: 'R2' },
    ],
  },
  {
    code: 'G',
    title: 'งานระบบและเบ็ดเตล็ด / Services & Miscellaneous',
    items: [
      { no: 'G1', th: 'ระบบไฟส่องสว่าง LED', en: 'LED high-bay lighting', unit: 'เหมา', qty: 1, rate: 35000, ref: '' },
      { no: 'G2', th: 'อุปกรณ์ความปลอดภัยและดับเพลิง', en: 'Safety & fire equipment', unit: 'เหมา', qty: 1, rate: 18000, ref: '' },
      { no: 'G3', th: 'ป้ายและการแบ่งโซน', en: 'Signage & zone marking', unit: 'เหมา', qty: 1, rate: 6000, ref: '' },
    ],
  },
  {
    code: 'H',
    title: 'งานผนังและประตูเปิด-ปิด / Walls & Openable Doors',
    items: [
      { no: 'H1', th: 'ประตูเหล็กบานเปิดคู่ หน้าโรงเรือน (พร้อมวงกบ)', en: 'Front steel double swing doors (incl. frame)', unit: 'ชุด', qty: 1, rate: 48000, ref: 'R5' },
      { no: 'H2', th: 'ผนังเมทัลชีทด้านข้างแบบม้วนเปิด-ปิด พร้อมรางและแกนม้วน', en: 'Roll-up metal-sheet side walls (incl. track & drum)', unit: 'ชุด', qty: 10, rate: 11500, ref: 'R3' },
      { no: 'H3', th: 'อุปกรณ์ยึด รางเลื่อน และงานติดตั้ง', en: 'Hardware, tracks & installation', unit: 'เหมา', qty: 1, rate: 15000, ref: '' },
    ],
  },
]

export const matFrac: Record<string, number> = {
  A: 0.35, B: 0.60, C: 0.70, D: 0.65, E: 0.55, F: 0.50, G: 0.70, H: 0.65,
}

export const FOOTPRINT_SQM = 200
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
  { id: 'R1', text: 'สำนักงานนโยบายและยุทธศาสตร์การค้า (สนค.) กระทรวงพาณิชย์ — ราคาวัสดุก่อสร้างรายจังหวัด 2568', url: 'index.tpso.go.th/construction-material-prices' },
  { id: 'R2', text: 'บัญชีราคาค่าวัสดุก่อสร้างและค่าแรงงาน ปีงบประมาณ 2568 (สพฐ. กระทรวงศึกษาธิการ) — คอนกรีตผสมเสร็จโครงสร้างติดดิน ~1,845 บาท/ลบ.ม.', url: 'yotathai.com/yotanews/obec2568' },
  { id: 'R3', text: 'แสงไทยเมทัลชีท (2568) — หลังคาเมทัลชีททรงจั่ว หนารวม ≥0.47 มม. ราคา 370–430 บาท/ตร.ม.', url: 'sangthaimetalsheet.com' },
  { id: 'R4', text: 'KS Group Metal Sheet — ค่าวัสดุเมทัลชีท 200–300 บาท/ตร.ม. (เคลือบสี 300–400 บาท/ตร.ม.)', url: 'ksgroup-metalsheet.com' },
  { id: 'R5', text: 'Pebsteel TH / Easy Warehouse — โครงสร้างเหล็ก main frame 2,500–3,500 บาท/ตร.ม. · ราคารวมก่อสร้างโกดังโครงสร้างเหล็ก 5,500–9,000 บาท/ตร.ม.', url: 'th.pebsteel.com · easywarehouse-thailand.com' },
  { id: 'R6', text: 'มูลนิธิประเมินค่า-นายหน้าแห่งประเทศไทย — ราคาประเมินค่าก่อสร้างอาคาร (อ้างอิงเทียบเคียง)', url: 'thaiappraisal.org' },
]

export const META = [
  { label: 'โครงการ / Project', value: 'ศูนย์รวบรวมฟางข้าว' },
  { label: 'สถานที่ / Location', value: 'พื้นที่นาข้าว ชนบท' },
  { label: 'ขนาดอาคาร / Footprint', value: '20 × 10 m (200 m²)' },
  { label: 'โครงสร้าง / Structure', value: 'เหล็ก ผนังเปิด-ปิดได้ จั่ว' },
]

export const NOTES = [
  'ราคาเป็นการประมาณการเบื้องต้นสำหรับศึกษาความเป็นไปได้ (preliminary, feasibility-stage estimate).',
  'ราคาวัสดุและค่าแรงอ้างอิงตลาดชนบทไทย อาจเปลี่ยนแปลงตามพื้นที่และช่วงเวลา.',
  'ไม่รวมค่าที่ดิน, ค่าออกแบบ/ขออนุญาต, ระบบไฟฟ้าแรงสูง และงานน้ำประปา.',
  'Foundation sizing assumes firm soil; pile foundation not included.',
]
