export type Vec3 = [number, number, number]

export interface Zone {
  key: string
  label: string
  th: string
  color: string
  pos: Vec3
  desc: string
  descTh: string
}

export const zones: Zone[] = [
  {
    key: 'storage',
    th: 'โซนกองเก็บฟางอัดก้อน',
    descTh: 'ฟางอัดก้อนสี่เหลี่ยมเรียงเป็นแถวบนพื้นคอนกรีตยกระดับ พ้นความชื้นจากพื้นดิน และจัดเรียงให้หยิบออกแบบเข้าก่อน-ออกก่อน',
    label: 'Straw Bale Storage Zone',
    color: '#c8902f',
    pos: [-4, 4.7, 2.5],
    desc: 'Compressed rectangular bales are stacked in neat rows on the raised concrete slab, kept clear of ground moisture and organised for first-in / first-out collection.',
  },
  {
    key: 'loading',
    th: 'จุดขนขึ้น-ลงรถบรรทุก',
    descTh: 'ลานหน้าโกดังกว้างให้รถบรรทุกและรถไถจอดขนฟางขึ้น-ลง มีทางลาดขึ้นพื้นโกดังสำหรับรถเข็นและโฟล์คลิฟต์',
    label: 'Truck Loading / Unloading',
    color: '#2f6b3f',
    pos: [17.8, 3.4, 4.3],
    desc: 'A wide front apron lets trucks and tractors park to load and unload bales, with a gentle ramp up to the slab for trolleys and forklifts.',
  },
  {
    key: 'lane',
    th: 'ทางวิ่งภายในโกดัง',
    descTh: 'ทางโล่งกลางโกดังให้โฟล์คลิฟต์และรถไถเล็กขนฟางเข้า-ออกได้ โดยไม่กระทบกองฟาง',
    label: 'Internal Access Lane',
    color: '#3f7fae',
    pos: [4, 1.2, -1.2],
    desc: 'A clear internal aisle runs through the warehouse so forklifts and small tractors can move bales in and out without disturbing the stacks.',
  },
  {
    key: 'vent',
    th: 'การระบายอากาศ (ผนังเปิดโล่ง)',
    descTh: 'ผนังด้านข้างเปิดโล่งให้ลมพัดผ่านกองฟาง ไล่ความชื้น ป้องกันเชื้อรา ความร้อนสะสม และฟางเสีย',
    label: 'Ventilation (Open Sides)',
    color: '#5aa17a',
    pos: [-4, 5.6, 5.6],
    desc: 'Fully open sides allow cross-breeze through the bale stacks, drawing out humidity to prevent mould, heating and spoilage of the straw.',
  },
  {
    key: 'drain',
    th: 'ระบบระบายน้ำ',
    descTh: 'รางรอบอาคารรับน้ำฝนจากหลังคา แล้วระบายออกจากพื้นโกดังไปลงคลองชลประทานใกล้เคียง',
    label: 'Drainage System',
    color: '#7a6cc4',
    pos: [8, 0.6, 6.4],
    desc: 'Perimeter channels collect roof runoff and direct rainwater away from the slab toward the nearby irrigation canal.',
  },
  {
    key: 'roof',
    th: 'หลังคาและการกันฝน',
    descTh: 'หลังคาจั่วเมทัลชีททรงสูง ชายคากว้าง พร้อมรางน้ำ กันฝนมรสุมหนัก และบังแดดไม่ให้ส่องฟางโดยตรง',
    label: 'Roof & Rain Protection',
    color: '#c25b46',
    pos: [0, 10.2, 0],
    desc: 'A high gable roof in metal sheeting with wide overhangs and gutters sheds heavy monsoon rain and shades the straw from direct sun.',
  },
  {
    key: 'road',
    th: 'ถนนดินเข้าโกดัง',
    descTh: 'ถนนดินบดอัดเชื่อมโกดังกับทุ่งนาโดยรอบ และเส้นทางหลักของรถรับฟาง',
    label: 'Dirt Access Road',
    color: '#9a7b4f',
    pos: [22, 0.5, 9],
    desc: 'A compacted dirt road links the warehouse directly to the surrounding rice fields and the main route used by collection trucks.',
  },
]

export type ViewName = 'front' | 'side' | 'top' | 'interior' | 'iso'

export interface View {
  pos: Vec3
  look: Vec3
}

export const views: Record<ViewName, View> = {
  front: { pos: [34, 9, 0], look: [0, 3, 0] },
  side: { pos: [0, 9, 32], look: [0, 3, 0] },
  top: { pos: [18, 30, 18], look: [0, 0, 0] },
  interior: { pos: [8.5, 2.3, -1.2], look: [-8, 2.2, -1.2] },
  iso: { pos: [30, 22, 32], look: [0, 2, 0] },
}

// guided-tour shots, in the order a load of straw moves through the hub
// (zone: null = overview). Camera positions are hand-placed per zone.
export const tourShots: { zone: string | null; view: View }[] = [
  { zone: null, view: views.iso },
  { zone: 'road', view: { pos: [36, 6, 18], look: [20, 1, 8] } },
  { zone: 'loading', view: { pos: [27, 5, 13], look: [15, 1.5, 3] } },
  { zone: 'lane', view: views.interior },
  { zone: 'storage', view: { pos: [-2, 4.5, 15], look: [-4, 3, 2] } },
  { zone: 'vent', view: { pos: [-15, 6, 15], look: [-4, 4, 5] } },
  { zone: 'roof', view: { pos: [-21, 18, 19], look: [0, 8, 0] } },
  { zone: 'drain', view: { pos: [13, 4, 15], look: [8, 0.6, 6.4] } },
]

// shared geometry constants (world units = metres)
// Building: 18 m long (x) × 10 m deep (z) · slab top (floor) at y=0.6
// Floor→roof (ridge) = 9.0 m → ridge at y=9.6 · clear height (eave) = 6.4 m → eave at y=7.0
export const FLOOR_TOP = 0.6
export const EAVE = 7.0
export const RIDGE = 9.6
export const COL_XS = [-9, -5.4, -1.8, 1.8, 5.4, 9]
export const COL_ZS = [-5, 5]

// dimension annotations shown when Dimensions is on (heights measured from the floor)
export const dimLabels: { t: string; p: Vec3 }[] = [
  { t: '18 m', p: [0, 0.6, 8] },
  { t: '10 m', p: [12.5, 0.6, 0] },
  { t: '6.4 m · eave', p: [-11.5, 3.8, 8] },
  { t: '9.0 m · floor→roof', p: [-14, 5.1, 0] },
]
