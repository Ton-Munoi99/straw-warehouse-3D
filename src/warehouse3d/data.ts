import * as THREE from 'three'

export type Vec3 = [number, number, number]

export interface Zone {
  key: string
  label: string
  color: string
  pos: Vec3
  desc: string
}

export const zones: Zone[] = [
  {
    key: 'storage',
    label: 'Straw Bale Storage Zone',
    color: '#c8902f',
    pos: [-5, 2.7, 0],
    desc: 'Compressed rectangular bales are stacked in neat rows on the raised concrete slab, kept clear of ground moisture and organised for first-in / first-out collection.',
  },
  {
    key: 'loading',
    label: 'Truck Loading / Unloading',
    color: '#2f6b3f',
    pos: [14, 1.7, 0],
    desc: 'A wide front apron lets trucks and tractors park to load and unload bales, with a gentle ramp up to the slab for trolleys and forklifts.',
  },
  {
    key: 'lane',
    label: 'Internal Access Lane',
    color: '#3f7fae',
    pos: [5, 1.2, 0],
    desc: 'A clear internal aisle runs through the warehouse so forklifts and small tractors can move bales in and out without disturbing the stacks.',
  },
  {
    key: 'vent',
    label: 'Ventilation (Open Sides)',
    color: '#5aa17a',
    pos: [-4, 4.7, 5.6],
    desc: 'Fully open sides allow cross-breeze through the bale stacks, drawing out humidity to prevent mould, heating and spoilage of the straw.',
  },
  {
    key: 'drain',
    label: 'Drainage System',
    color: '#7a6cc4',
    pos: [9, 0.6, 6.4],
    desc: 'Perimeter channels collect roof runoff and direct rainwater away from the slab toward the nearby irrigation canal.',
  },
  {
    key: 'roof',
    label: 'Roof & Rain Protection',
    color: '#c25b46',
    pos: [0, 8.1, 0],
    desc: 'A high gable roof in metal sheeting with wide overhangs and gutters sheds heavy monsoon rain and shades the straw from direct sun.',
  },
  {
    key: 'road',
    label: 'Dirt Access Road',
    color: '#9a7b4f',
    pos: [24, 0.5, 9],
    desc: 'A compacted dirt road links the warehouse directly to the surrounding rice fields and the main route used by collection trucks.',
  },
]

export type ViewName = 'front' | 'side' | 'top' | 'interior' | 'iso'

export interface View {
  pos: Vec3
  look: Vec3
}

export const views: Record<ViewName, View> = {
  front: { pos: [0, 9, 32], look: [0, 3, 0] },
  side: { pos: [34, 9, 0], look: [0, 3, 0] },
  top: { pos: [18, 30, 18], look: [0, 0, 0] },
  interior: { pos: [9, 3, 1], look: [-9, 2.2, 0] },
  iso: { pos: [26, 15, 24], look: [0, 2, 0] },
}

// shared geometry constants (world units = metres)
export const FLOOR_TOP = 0.6
export const EAVE = 5.0
export const RIDGE = 7.6
export const COL_XS = [-10, -6, -2, 2, 6, 10]
export const COL_ZS = [-5, 5]

export const SKY = {
  sunny: new THREE.Color('#d2e8f2'),
  rainy: new THREE.Color('#97a4ad'),
}

// dimension annotations shown when Dimensions is on
export const dimLabels: { t: string; p: Vec3 }[] = [
  { t: '20 m', p: [0, 0.6, 8] },
  { t: '10 m', p: [13.5, 0.6, 0] },
  { t: '5.0 m · eave', p: [-12.5, 2.6, 8] },
  { t: '7.6 m · ridge', p: [-15, 3.9, 0] },
]
