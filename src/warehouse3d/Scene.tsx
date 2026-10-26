import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, RoundedBox } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ConstructionDetails, DetailedBales, RiceRows, surfaceTexture } from './Details'
import {
  COL_XS,
  COL_ZS,
  EAVE,
  FLOOR_TOP,
  RIDGE,
  Vec3,
  View,
  Zone,
  dimLabels,
  zones,
} from './data'

export type TimeOfDay = 'morning' | 'noon' | 'evening'

export interface SceneState {
  rotate: boolean
  labels: boolean
  selected: string | null
  doorsOpen: boolean
  wallsOpen: boolean
  weather: 'sunny' | 'rainy'
  time: TimeOfDay
  activity: boolean
  dims: boolean
  layers: number // bale layers drawn (0 … STORAGE.maxLayers)
  recording: boolean // capturing one full 360° orbit to a video file
}

// Every camera move (view buttons + guided tour) takes the same fixed time with an
// ease-in-out curve — time-based, so it's equally smooth at 30 or 120 fps.
export const CAMERA_MOVE_MS = 1400
const easeInOutCubic = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

export interface CameraController {
  setView: (v: View) => void
  zoom: (factor: number) => void
}

type Mat = THREE.MeshStandardMaterial
// `po` adds a polygon offset (pulls the surface toward the camera) so thin,
// near-coplanar ground overlays don't z-fight with the grass plane / apron.
const mk = (c: string, o: { m?: number; r?: number; side?: THREE.Side; po?: number } = {}) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(c),
    roughness: o.r ?? 0.85,
    metalness: o.m ?? 0,
    ...(o.side ? { side: o.side } : {}),
    ...(o.po
      ? { polygonOffset: true, polygonOffsetFactor: o.po, polygonOffsetUnits: o.po }
      : {}),
  })

function useMaterials() {
  const materials = useMemo(() => {
    const bale = ['#eee0ba', '#e1cfa1', '#e9d5ab', '#dac79a', '#e4d5b0'].map((c) =>
      mk(c, { r: 0.96 }),
    )
    const foliage = ['#657e55', '#7e9469', '#566e4b'].map((c) => mk(c, { r: 0.95 }))
    const concrete = surfaceTexture('concrete')
    const earth = surfaceTexture('earth')
    const straw = surfaceTexture('straw')
    const metal = surfaceTexture('metal')
    const textured = (color: string, map: THREE.Texture, bump: number, m = 0) => new THREE.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: bump, roughness: .85, metalness: m })
    bale.forEach(m => { m.map = straw; m.bumpMap = straw; m.bumpScale = .015 })
    return {
      steel: mk('#707b79', { m: 0.25, r: 0.55 }),
      steelDark: mk('#5f666e', { m: 0.6, r: 0.5 }),
      grass: mk('#9da984', { r: 0.97 }),
      apron: textured('#eee9dc', concrete, .025), // concrete yard around the warehouse
      greenPatch: mk('#a7b28b', { r: 0.96, po: -3 }), // grass patches for balance
      slab: textured('#e8e5db', concrete, .018),
      ramp: textured('#dedacf', concrete, .02),
      drainCh: mk('#565b52', { r: 0.9, po: -5 }),
      road: textured('#d8d2c6', earth, .05), // neutral tint — warm sun + earth bounce already push it brown
      canalBank: mk('#bda57b', { r: 0.97 }),
      canalWater: mk('#5fa0c4', { m: 0.25, r: 0.18 }),
      paddy: mk('#94a875', { r: 0.95 }),
      paddyGreen2: mk('#82996c', { r: 0.95 }),
      paddyGold: mk('#c8bd83', { r: 0.9 }),
      paddyGold2: mk('#b9ad78', { r: 0.91 }),
      paddyGold3: mk('#d7cea0', { r: 0.9 }),
      bund: mk('#afa38a', { r: 0.97 }),
      roofMetal: textured('#e0e5e5', metal, .002, .35),
      rib: mk('#aeb3b8', { m: 0.5, r: 0.5 }),
      ridgeCap: mk('#9aa0a6', { m: 0.55, r: 0.4 }),
      gable: mk('#dcd7c9', { r: 0.85, side: THREE.DoubleSide }),
      gutter: mk('#9aa0a6', { m: 0.4, r: 0.5 }),
      downpipe: mk('#9aa0a6', { m: 0.4 }),
      panel: mk('#c4ccd2', { m: 0.35, r: 0.55 }),
      frame: mk('#7f8790', { m: 0.5, r: 0.5 }),
      doorRib: mk('#aeb6bd', { m: 0.4, r: 0.55 }),
      win: mk('#9fc4dd', { m: 0.2, r: 0.2 }),
      truckCab: mk('#c0392b', { m: 0.3, r: 0.45 }),
      truckCabDark: mk('#8f2b20', { m: 0.3, r: 0.5 }),
      truckBed: mk('#7a6f5e', { m: 0.2, r: 0.7 }),
      truckChassis: mk('#33383d', { m: 0.4, r: 0.6 }),
      chrome: mk('#b8bcc0', { m: 0.75, r: 0.3 }),
      headlight: mk('#ffe9b0', { m: 0.3, r: 0.25 }),
      taillight: mk('#cf3b2f', { m: 0.3, r: 0.3 }),
      hub: mk('#9aa0a6', { m: 0.6, r: 0.4 }),
      wheel: mk('#23262a', { r: 0.7 }),
      forkBody: mk('#d9821f', { m: 0.3, r: 0.5 }),
      forkSeat: mk('#2c2f33', { r: 0.7 }),
      trunk: mk('#6b4f2a', { r: 0.95 }),
      // people
      skin: mk('#c89a72', { r: 0.8 }),
      hat: mk('#d8c98a', { r: 0.9 }),
      shirtA: mk('#3d6bb0', { r: 0.8 }),
      shirtB: mk('#cf6a3a', { r: 0.8 }),
      shirtC: mk('#4f7a4a', { r: 0.8 }),
      shirtD: mk('#e0e2e6', { r: 0.8 }),
      pants: mk('#3a4049', { r: 0.85 }),
      bale,
      foliage,
    }
  }, [])
  useEffect(() => () => {
    const textures = new Set<THREE.Texture>()
    Object.values(materials).flat().forEach(material => {
      if (material.map) textures.add(material.map)
      material.dispose()
    })
    textures.forEach(texture => texture.dispose())
  }, [materials])
  return materials
}

type Mats = ReturnType<typeof useMaterials>

/** Shared box mesh helper bound to a pre-built material. */
function B({
  size,
  pos,
  rot,
  mat,
  cast = true,
  recv = true,
}: {
  size: Vec3
  pos: Vec3
  rot?: Vec3
  mat: Mat
  cast?: boolean
  recv?: boolean
}) {
  return (
    <mesh position={pos} rotation={rot} material={mat} castShadow={cast} receiveShadow={recv}>
      <boxGeometry args={size} />
    </mesh>
  )
}

// ---- camera rig: presets tween + dolly zoom + autorotate ----
// Records exactly one full orbit: azimuth is accumulated per frame, so the clip ends at
// 360° even if the frame rate dips. MP4 where the browser can encode it, else WebM.
const RECORD_TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']

function Rig({
  controllerRef,
  rotate,
  recording,
  onRecorded,
}: {
  controllerRef: React.MutableRefObject<CameraController | null>
  rotate: boolean
  recording: boolean
  onRecorded: (clip: Blob | null) => void
}) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = size.width / size.height < 1.15 ? 56 : 42
      camera.updateProjectionMatrix()
    }
  }, [camera, size.width, size.height])
  const controls = useThree((s) => s.controls) as any
  const tween = useRef({
    fromPos: new THREE.Vector3(), fromLook: new THREE.Vector3(),
    pos: new THREE.Vector3(), look: new THREE.Vector3(),
    t0: 0, active: false,
  })

  useEffect(() => {
    if (!controls) return
    controllerRef.current = {
      setView: (v) => {
        const tw = tween.current
        tw.fromPos.copy(camera.position)
        tw.fromLook.copy(controls.target)
        tw.pos.set(...v.pos)
        tw.look.set(...v.look)
        tw.t0 = performance.now()
        tw.active = true
        controls.autoRotate = false
      },
      zoom: (f) => {
        const t = controls.target as THREE.Vector3
        const off = camera.position.clone().sub(t)
        const d = Math.max(8, Math.min(90, off.length() * f))
        off.setLength(d)
        camera.position.copy(t.clone().add(off))
        tween.current.active = false
      },
    }
  }, [controls, camera, controllerRef])

  const rec = useRef<{ mr: MediaRecorder; last: number; turned: number } | null>(null)
  useEffect(() => {
    if (!recording || !controls) return
    const type = typeof MediaRecorder === 'undefined' ? undefined : RECORD_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
    if (!type) {
      onRecorded(null)
      return
    }
    tween.current.active = false
    const stream = gl.domElement.captureStream(30)
    const mr = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8_000_000 })
    const chunks: Blob[] = []
    let cancelled = false
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      onRecorded(cancelled ? null : new Blob(chunks, { type: type.split(';')[0] }))
    }
    mr.start(250)
    rec.current = { mr, last: controls.getAzimuthalAngle(), turned: 0 }
    return () => {
      // recording switched off before the orbit finished → discard the partial clip
      rec.current = null
      if (mr.state !== 'inactive') {
        cancelled = true
        mr.stop()
      }
    }
  }, [recording, controls, gl, onRecorded])

  useFrame(() => {
    if (!controls) return
    controls.autoRotate = rotate || recording
    const r = rec.current
    if (r) {
      const a = controls.getAzimuthalAngle()
      let d = a - r.last
      if (d > Math.PI) d -= 2 * Math.PI
      if (d < -Math.PI) d += 2 * Math.PI
      r.turned += Math.abs(d)
      r.last = a
      if (r.turned >= 2 * Math.PI) {
        rec.current = null
        r.mr.stop()
      }
    }
    const tw = tween.current
    if (tw.active) {
      const k = Math.min(1, (performance.now() - tw.t0) / CAMERA_MOVE_MS)
      const e = easeInOutCubic(k)
      camera.position.lerpVectors(tw.fromPos, tw.pos, e)
      controls.target.lerpVectors(tw.fromLook, tw.look, e)
      if (k === 1) tw.active = false
    }
  })

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      target={[0, 2, 0]}
      maxPolarAngle={Math.PI * 0.495}
      minDistance={8}
      maxDistance={95}
      onStart={() => { tween.current.active = false }}
      autoRotateSpeed={recording ? 4 : 0.9}
    />
  )
}

// ---- weather: gradient sky (background + image-based light), fog, sun + rain ----
// One lighting set per time of day; rain overrides the time. Sky colours are pre-darkened
// because the post-process ACES pass tone-maps the background too (three's own renderer
// leaves sRGB backgrounds un-tone-mapped), which lifts and greys them. `haze` is both the
// horizon colour and the fog colour, so the fogged ground edge melts into the sky.
// ponytail: hand-tuned presets, not a sun-path model — add one if a date/hour picker is wanted.
type Lighting = {
  sun: Vec3; sunColor: string; sunI: number
  zenith: string; mid: string; haze: string; earth: string
  hemi: string; hemiI: number; amb: number; env: number; fogNear: number; fogFar: number
}
const LIGHTING: Record<TimeOfDay | 'rainy', Lighting> = {
  morning: {
    sun: [-38, 17, 26], sunColor: '#ffdcb0', sunI: 2.4,
    zenith: '#2f66ae', mid: '#86acd6', haze: '#e3e1d8', earth: '#b8ae8c',
    hemi: '#d6e6f5', hemiI: 0.35, amb: 0.05, env: 0.95, fogNear: 70, fogFar: 240,
  },
  noon: {
    sun: [36, 46, 20], sunColor: '#ffe9c7', sunI: 2.8,
    zenith: '#2a62ad', mid: '#5b8fcb', haze: '#dce6ec', earth: '#b8ae8c',
    hemi: '#cfe8ff', hemiI: 0.35, amb: 0.05, env: 1, fogNear: 70, fogFar: 240,
  },
  evening: {
    // not grazing along x: the roof ribs run downslope, so a low sun from ±x lights one rib
    // face and not the other → sub-pixel stripes → moiré on the roof. Keep a +z component.
    sun: [38, 12, 24], sunColor: '#ffaa62', sunI: 2.5,
    zenith: '#2a477f', mid: '#a7867f', haze: '#efb98c', earth: '#9c8a6e',
    hemi: '#f2c9a0', hemiI: 0.3, amb: 0.05, env: 0.8, fogNear: 60, fogFar: 220,
  },
  rainy: {
    sun: [36, 46, 20], sunColor: '#c2cad1', sunI: 0.6,
    zenith: '#6f7d87', mid: '#8d9aa3', haze: '#97a4ad', earth: '#7d7a6c',
    hemi: '#aab6bf', hemiI: 0.5, amb: 0.25, env: 0.6, fogNear: 40, fogFar: 150,
  },
}

// ponytail: a 2px-wide LDR canvas gradient as an equirect map — cheaper and far easier
// to tune than three's HDR Sky shader, which blew out at this scene's exposure.
// `below` is what shows under the horizon: haze for the visible background (so the
// fogged ground edge blends in), earth for lighting (warm bounce light from below).
function skyTexture(zenith: string, mid: string, horizon: string, below: string) {
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, zenith)
  grad.addColorStop(0.38, mid)
  grad.addColorStop(0.485, horizon)
  grad.addColorStop(0.52, below)
  grad.addColorStop(1, below)
  g.fillStyle = grad
  g.fillRect(0, 0, 2, 256)
  const t = new THREE.CanvasTexture(c)
  t.mapping = THREE.EquirectangularReflectionMapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Weather({ weather, time }: { weather: 'sunny' | 'rainy'; time: TimeOfDay }) {
  const scene = useThree((s) => s.scene)
  const sun = useRef<THREE.DirectionalLight>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const amb = useRef<THREE.AmbientLight>(null!)
  const rain = useRef<THREE.LineSegments>(null!)

  const rainPos = useMemo(() => {
    const RN = 1800
    const p = new Float32Array(RN * 6)
    for (let i = 0; i < RN; i++) {
      const x = (Math.random() - .5) * 72, y = Math.random() * 34, z = (Math.random() - .5) * 72
      p.set([x, y, z, x + .05, y + .5, z], i * 6)
    }
    return p
  }, [])

  useEffect(() => {
    const L = LIGHTING[weather === 'rainy' ? 'rainy' : time]
    const bg = skyTexture(L.zenith, L.mid, L.haze, L.haze)
    const env = skyTexture(L.zenith, L.mid, L.haze, L.earth)
    scene.background = bg
    scene.environment = env
    scene.environmentIntensity = L.env
    if (!scene.fog) scene.fog = new THREE.Fog(L.haze, L.fogNear, L.fogFar)
    const fog = scene.fog as THREE.Fog
    fog.color.set(L.haze)
    fog.near = L.fogNear
    fog.far = L.fogFar
    // ponytail: the sky environment supplies most fill light, so hemi/ambient stay low —
    // raising them again is what made the scene look washed out.
    if (sun.current) {
      sun.current.position.set(...L.sun)
      sun.current.intensity = L.sunI
      sun.current.color.set(L.sunColor)
    }
    if (hemi.current) {
      hemi.current.intensity = L.hemiI
      hemi.current.color.set(L.hemi)
    }
    if (amb.current) amb.current.intensity = L.amb
    return () => {
      bg.dispose()
      env.dispose()
    }
  }, [weather, time, scene])

  useFrame((_, delta) => {
    if (weather !== 'rainy' || !rain.current) return
    const p = rainPos
    for (let i = 1; i < p.length; i += 6) {
      p[i] -= Math.min(delta, .1) * 15
      if (p[i] < 0) p[i] = 34
      p[i + 3] = p[i] + .5
    }
    rain.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#cfe8ff', '#c1baa3', 0.6]} />
      <ambientLight ref={amb} intensity={0.22} />
      <directionalLight
        ref={sun}
        color="#fff1d6"
        intensity={1.2}
        position={LIGHTING.noon.sun}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-near={1}
        shadow-camera-far={170}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
        shadow-radius={3}
      />
      <lineSegments ref={rain} visible={weather === 'rainy'}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rainPos, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#bfd0db"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </lineSegments>
    </>
  )
}

// ---- ground & surrounding site ----
function Site({ mats }: { mats: Mats }) {
  const rampGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(9.7, .10); shape.lineTo(14.1, .10); shape.lineTo(14.1, .12); shape.lineTo(9.7, FLOOR_TOP); shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false })
  }, [])
  useEffect(() => () => rampGeometry.dispose(), [rampGeometry])
  const pmat: Record<string, Mat> = {
    g1: mats.paddyGold,
    g2: mats.paddyGold2,
    g3: mats.paddyGold3,
    gr: mats.paddy,
    gr2: mats.paddyGreen2,
  }
  // a patchwork of paddy fields surrounding the site — mostly golden ripe rice
  const paddies = useMemo(() => {
    const tiles: { pos: Vec3; size: Vec3; mat: string }[] = []
    const bunds: { size: Vec3; pos: Vec3 }[] = []
    const TW = 16
    const TD = 14
    const GAP = 1.3
    const stepX = TW + GAP
    const stepZ = TD + GAP
    const NX = 5
    const NZ = 5
    for (let gx = -NX; gx <= NX; gx++) {
      for (let gz = -NZ; gz <= NZ; gz++) {
        const cx = gx * stepX
        const cz = gz * stepZ
        // leave the central yard (building + road + canal) clear
        if (Math.abs(cx) < 27 && Math.abs(cz) < 24) continue
        const h = (Math.abs(gx) * 7 + Math.abs(gz) * 13 + gx * gz + 40) % 10
        const dist = Math.hypot(cx, cz)
        let mat: string
        if (dist > 72) mat = h < 8 ? 'g3' : 'g1' // far horizon = bright gold
        else if (h < 2) mat = 'gr'
        else if (h < 3) mat = 'gr2'
        else if (h < 6) mat = 'g1'
        else if (h < 8) mat = 'g2'
        else mat = 'g3'
        const w = TW + ((h % 3) - 1)
        const d = TD + (((h + 1) % 3) - 1)
        tiles.push({ pos: [cx, 0.08, cz], size: [w, 0.16, d], mat })
        // thin earth bunds on two edges
        bunds.push({ size: [w + GAP, 0.2, GAP * 0.55], pos: [cx, 0.1, cz - d / 2 - GAP / 2] })
        bunds.push({ size: [GAP * 0.55, 0.2, d], pos: [cx - w / 2 - GAP / 2, 0.1, cz] })
      }
    }
    return { tiles, bunds }
  }, [])

  // green patches on the concrete apron — for visual balance (top y = 0.14)
  const patches: { size: Vec3; pos: Vec3 }[] = [
    { size: [4.2, 0.08, 3.2], pos: [-12.6, 0.1, 6.4] },
    { size: [4.6, 0.08, 3.0], pos: [12.6, 0.1, 6.6] },
    { size: [3.6, 0.08, 3.4], pos: [-12.8, 0.1, -6.2] },
    { size: [5.2, 0.08, 2.0], pos: [-2.5, 0.1, 7.6] },
  ]

  return (
    <group>
      {/* grass base (shows beyond the apron, with the trees) — y = 0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.grass} receiveShadow>
        <planeGeometry args={[300, 300]} />
      </mesh>
      {/* concrete apron / working yard around the warehouse — top y = 0.10 */}
      <B size={[30, 0.16, 17]} pos={[0, 0.02, 0]} mat={mats.apron} cast={false} />
      {/* green patches on the apron for balance — top y = 0.14 */}
      {patches.map((p, i) => (
        <B key={`gp${i}`} size={p.size} pos={p.pos} mat={mats.greenPatch} cast={false} />
      ))}
      {/* raised concrete slab — top y = 0.60 */}
      <B size={[19.4, 0.6, 11]} pos={[0, 0.3, 0]} mat={mats.slab} />
      {/* front loading ramp */}
      <mesh geometry={rampGeometry} position={[0, 0, -2.5]} material={mats.ramp} receiveShadow />
      {/* drainage channels (raised dark covers) — top y = 0.16 */}
      {(
        [
          [0, 6.3, 20, 0.5],
          [0, -6.3, 20, 0.5],
          [10.2, 0, 0.5, 12.6],
          [-10.2, 0, 0.5, 12.6],
        ] as const
      ).map(([x, z, w, d], i) => (
        <B key={i} size={[w, 0.12, d]} pos={[x, 0.1, z]} mat={mats.drainCh} cast={false} />
      ))}
      {/* dirt access road — top y = 0.12 */}
      <B size={[9, 0.06, 52]} pos={[20, 0.09, 12]} mat={mats.road} cast={false} />
      <B size={[9, 0.06, 40]} pos={[17, 0.09, 9.5]} rot={[0, Math.PI / 2, 0]} mat={mats.road} cast={false} />
      {/* irrigation canal */}
      {[15.15, 17.85].map(z => <B key={z} size={[90, .3, .6]} pos={[0, .15, z]} mat={mats.canalBank} cast={false} />)}
      <B size={[90, 0.4, 2]} pos={[0, 0.0, 16.5]} mat={mats.canalWater} cast={false} />
      <RiceRows tiles={paddies.tiles} />
      {/* surrounding rice paddies — golden fields */}
      {paddies.tiles.map((t, i) => (
        <B key={`p${i}`} size={t.size} pos={t.pos} mat={pmat[t.mat]} cast={false} recv={false} />
      ))}
      {paddies.bunds.map((b, i) => (
        <B key={`b${i}`} size={b.size} pos={b.pos} mat={mats.bund} cast={false} recv={false} />
      ))}
    </group>
  )
}

// ---- steel frame: columns, beams, trusses, purlins ----
function Structure({ mats }: { mats: Mats }) {
  const ang = Math.atan2(RIDGE - EAVE, 5)
  const chordLen = Math.hypot(5, RIDGE - EAVE)
  return (
    <group>
      {COL_XS.map((x) =>
        COL_ZS.map((z) => (
          <group key={`c${x}_${z}`}>
            {/* H-200 profile from the current BOQ; flange/web thickness illustrative. */}
            <B size={[.008, EAVE - FLOOR_TOP, .2]} pos={[x, (EAVE + FLOOR_TOP) / 2, z]} mat={mats.steel} />
            {[-.094, .094].map(offset => <B key={offset} size={[.2, EAVE - FLOOR_TOP, .012]} pos={[x, (EAVE + FLOOR_TOP) / 2, z + offset]} mat={mats.steel} />)}
            <B size={[0.38, 0.025, 0.38]} pos={[x, FLOOR_TOP + 0.05, z]} mat={mats.steelDark} />
          </group>
        )),
      )}
      {/* eave beams along X */}
      {COL_ZS.map((z) => (
        <B key={`eb${z}`} size={[19.5, 0.3, 0.3]} pos={[0, EAVE - .25, z]} mat={mats.steel} />
      ))}
      {/* tie beams along Z */}
      {COL_XS.map((x) => (
        <B key={`tb${x}`} size={[0.26, 0.26, 10]} pos={[x, EAVE - .18, 0]} mat={mats.steel} />
      ))}
      {/* trusses per frame line */}
      {COL_XS.map((x) => (
        <group key={`tr${x}`}>
          <B size={[0.2, 0.2, 10]} pos={[x, EAVE - .18, 0]} mat={mats.steelDark} />
          <B size={[0.16, RIDGE - EAVE - .15, 0.16]} pos={[x, EAVE + (RIDGE - EAVE - .15) / 2, 0]} mat={mats.steelDark} />
          {[-1, 1].map((s) => (
            <B
              key={s}
              size={[0.2, 0.18, chordLen]}
              pos={[x, (EAVE + RIDGE) / 2 - .14, s * 2.5]}
              rot={[s * ang, 0, 0]}
              mat={mats.steel}
            />
          ))}
          {[-2.5, 2.5].map((z) => {
            const yTop = EAVE + (1 - Math.abs(z) / 5) * (RIDGE - EAVE) - .14
            return (
              <B
                key={`w${z}`}
                size={[0.13, yTop - EAVE, 0.13]}
                pos={[x, (EAVE + yTop) / 2, z]}
                mat={mats.steelDark}
              />
            )
          })}
        </group>
      ))}
      {/* purlins along both slopes */}
      {[0.28, 0.55, 0.82].map((t) =>
        [-1, 1].map((s) => {
          const z = s * (1 - t) * 5
          const y = EAVE + t * (RIDGE - EAVE)
          return <B key={`pu${t}_${s}`} size={[19.6, 0.1, 0.1]} pos={[0, y - .14, z]} mat={mats.steelDark} />
        }),
      )}
      <B size={[19.6, 0.12, 0.12]} pos={[0, RIDGE - .14, 0]} mat={mats.steelDark} />
    </group>
  )
}

// ---- roof panels, ribs, ridge cap, gable triangles, gutters, downpipes ----
function Roof({ mats }: { mats: Mats }) {
  const ang = Math.atan2(RIDGE - EAVE, 5)
  const ohZ = 1.2
  const ohX = 1.5
  const runZ = 5 + ohZ
  const slopeLen = Math.hypot(runZ, (runZ * (RIDGE - EAVE)) / 5)
  const roofLenX = 18 + ohX * 2
  const yMidPanel = (RIDGE + (EAVE - (ohZ * (RIDGE - EAVE)) / 5)) / 2

  const gableGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, EAVE, -5, 0, EAVE, 5, 0, RIDGE, 0], 3),
    )
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={`slope${s}`}>
          <B
            size={[roofLenX, 0.035, slopeLen]}
            pos={[0, yMidPanel, s * (runZ / 2)]}
            rot={[s * ang, 0, 0]}
            mat={mats.roofMetal}
          />
          {Array.from({ length: 85 }, (_, k) => k - 42).map((i) => (
            <B
              key={i}
              size={[0.026, 0.024, slopeLen]}
              pos={[i * .247, yMidPanel + 0.029, s * (runZ / 2)]}
              rot={[s * ang, 0, 0]}
              mat={mats.rib}
              cast={false}
            />
          ))}
        </group>
      ))}
      {/* ridge cap */}
      <B size={[roofLenX + 0.1, 0.08, 0.38]} pos={[0, RIDGE + 0.055, 0]} mat={mats.ridgeCap} />
      {/* gable end triangles */}
      {[-1, 1].map((sx) => (
        <mesh key={`g${sx}`} geometry={gableGeo} material={mats.gable} position={[sx * 9, 0, 0]} castShadow receiveShadow />
      ))}
      {/* gutters */}
      {[-1, 1].map((s) => (
        <B key={`gut${s}`} size={[roofLenX, 0.18, 0.22]} pos={[0, EAVE - ohZ * (RIDGE - EAVE) / 5 - 0.12, s * (5 + ohZ - 0.1)]} mat={mats.gutter} />
      ))}
      {/* downpipes */}
      {(
        [
          [-9.1, 5.9],
          [9.1, 5.9],
          [-9.1, -5.9],
          [9.1, -5.9],
        ] as const
      ).map(([x, z], i) => (
        <B key={`dp${i}`} size={[0.11, EAVE - .7, 0.11]} pos={[x, (EAVE - .7) / 2, z]} mat={mats.downpipe} />
      ))}
    </group>
  )
}

// ---- front swing doors (animated open/closed) ----
function Doors({ mats, open }: { mats: Mats; open: boolean }) {
  const leaves = useRef<(THREE.Group | null)[]>([])
  const cur = useRef(1)
  const doorH = 5.5
  const doorY0 = FLOOR_TOP

  const config = useMemo(
    () =>
      [5, -5].map((hz) => {
        const s = Math.sign(hz)
        return { hz, cz: -s * 2.4, openA: -s * 1.85, cy: doorY0 + doorH / 2 }
      }),
    [],
  )

  useFrame(() => {
    const target = open ? 1 : 0
    cur.current += (target - cur.current) * 0.12
    leaves.current.forEach((g, i) => {
      if (g) g.rotation.y = config[i].openA * cur.current
    })
  })

  return (
    <group>
      {config.map((c, i) => (
        <group key={i} ref={(el) => (leaves.current[i] = el)} position={[9, 0, c.hz]}>
          <B size={[0.018, doorH, 4.7]} pos={[0, c.cy, c.cz]} mat={mats.panel} />
          {[doorY0 + 0.16, doorY0 + doorH - 0.16].map((ry, k) => (
            <B key={k} size={[0.16, 0.2, 4.8]} pos={[0, ry, c.cz]} mat={mats.frame} />
          ))}
          {Array.from({ length: 24 }, (_, k) => -2.2 + k * .19).map((o, k) => (
            <B key={`r${k}`} size={[0.035, doorH - 0.5, 0.026]} pos={[0, c.cy, c.cz + o]} mat={mats.doorRib} />
          ))}
          <B size={[0.14, 0.45, 3.4]} pos={[0, doorY0 + doorH - 0.65, c.cz]} mat={mats.win} />
        </group>
      ))}
    </group>
  )
}

// ---- roll-up side wall panels (animated, anchored at top) ----
function SideWalls({ mats, open }: { mats: Mats; open: boolean }) {
  const grps = useRef<(THREE.Group | null)[]>([])
  const cur = useRef(1)
  const wallH = 6.0
  const doorY0 = FLOOR_TOP
  const bays = [-7.2, -3.6, 0, 3.6, 7.2]

  const panels = useMemo(() => {
    const out: { bx: number; sz: number }[] = []
    ;[-1, 1].forEach((sz) => bays.forEach((bx) => out.push({ bx, sz })))
    return out
  }, [])

  useFrame(() => {
    const target = open ? 1 : 0
    cur.current += (target - cur.current) * 0.12
    const sy = 1 - 0.94 * cur.current
    grps.current.forEach((g) => g && (g.scale.y = sy))
  })

  return (
    <group>
      {panels.map((p, i) => (
        <group key={i}>
          <group ref={(el) => (grps.current[i] = el)} position={[p.bx, doorY0 + wallH, p.sz * 5]}>
            <B size={[3.3, wallH, 0.016]} pos={[0, -wallH / 2, 0]} mat={mats.panel} />
            {Array.from({ length: 36 }, (_, k) => k).map((k) => (
              <B key={k} size={[3.3, 0.015, 0.026]} pos={[0, -.08 - k * .165, .016]} mat={mats.doorRib} />
            ))}
          </group>
          {/* roll drum at the eave (static) */}
          <mesh position={[p.bx, doorY0 + wallH + 0.12, p.sz * 5]} rotation={[0, 0, Math.PI / 2]} material={mats.frame} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.35, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// reusable wheel with hub cap
function Wheel({ pos, r = 0.55, mats }: { pos: Vec3; r?: number; mats: Mats }) {
  return (
    <group position={pos}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.wheel} castShadow>
        <cylinderGeometry args={[r, r, 0.4, 18]} />
      </mesh>
      <mesh position={[0, 0, Math.sign(pos[2] || 1) * 0.21]} rotation={[Math.PI / 2, 0, 0]} material={mats.hub}>
        <cylinderGeometry args={[r * 0.42, r * 0.42, 0.06, 12]} />
      </mesh>
    </group>
  )
}

// ---- parked delivery truck (stake-bed, facing the door, carrying bales) ----
function Truck({ mats }: { mats: Mats }) {
  // local frame: cab toward −x (forward), flatbed behind toward +x
  return (
    <group position={[17.8, .12, 4.3]} rotation={[0, 0, 0]}>
      {/* chassis frame */}
      <B size={[7.2, 0.32, 1.9]} pos={[-0.3, 0.78, 0]} mat={mats.truckChassis} />
      {/* cab */}
      <RoundedBox args={[2, 1.55, 2.45]} radius={.09} smoothness={3} position={[-2.7, 1.78, 0]} material={mats.truckCab} castShadow receiveShadow />
      <RoundedBox args={[1.05, .85, 2.35]} radius={.08} smoothness={3} position={[-3.85, 1.35, 0]} material={mats.truckCab} castShadow receiveShadow />
      {/* windshield + side windows */}
      <B size={[0.09, 0.7, 2.0]} pos={[-3.71, 2.05, 0]} mat={mats.win} />
      {[-1.24, 1.24].map((z) => (
        <B key={z} size={[1.3, 0.6, 0.06]} pos={[-2.7, 2.0, z]} mat={mats.win} />
      ))}
      {/* grille, bumper, headlights */}
      <B size={[0.16, 0.7, 2.0]} pos={[-4.42, 1.3, 0]} mat={mats.chrome} />
      <B size={[0.22, 0.3, 2.5]} pos={[-4.5, 0.78, 0]} mat={mats.chrome} />
      {[-0.72, 0.72].map((z) => (
        <B key={z} size={[0.1, 0.32, 0.4]} pos={[-4.45, 1.05, z]} mat={mats.headlight} />
      ))}
      {/* mirrors */}
      {[-1.35, 1.35].map((z) => (
        <B key={z} size={[0.1, 0.45, 0.1]} pos={[-3.6, 2.0, z]} mat={mats.truckChassis} />
      ))}
      {/* exhaust stack */}
      <mesh position={[-1.75, 1.9, 1.2]} material={mats.chrome} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.9, 10]} />
      </mesh>
      {/* flat bed + headboard + stake rails */}
      <B size={[4.6, 0.26, 2.7]} pos={[1.0, 1.07, 0]} mat={mats.truckBed} />
      <B size={[0.14, 1.05, 2.7]} pos={[-1.25, 1.6, 0]} mat={mats.truckChassis} />
      {[-1.32, 1.32].map((z) => (
        <B key={z} size={[4.6, 0.55, 0.12]} pos={[1.0, 1.42, z]} mat={mats.truckChassis} />
      ))}
      {[-1.1, 1.0, 3.1].map((x) =>
        [-1.32, 1.32].map((z) => (
          <B key={`${x}_${z}`} size={[0.12, 0.7, 0.12]} pos={[x, 1.5, z]} mat={mats.truckChassis} />
        )),
      )}
      {/* Small bales, resting on the bed rather than floating above it. */}
      {[0, 1, 2, 3].flatMap(layer => [0, 1, 2, 3].flatMap(col => [-.96, -.48, 0, .48, .96].map(z => (
        <B key={`${layer}${col}${z}`} size={[1, .36, .45]} pos={[-.57 + col * 1.04, 1.38 + layer * .365, z]} mat={mats.bale[(layer + col) % 5]} />
      ))))}
      {/* axles: front + rear dual */}
      {([[-3.0, -1.25], [-3.0, 1.25], [1.0, -1.3], [1.0, 1.3], [2.5, -1.3], [2.5, 1.3]] as const).map(([wx, wz], i) => (
        <Wheel key={i} pos={[wx, 0.55, wz]} mats={mats} />
      ))}
    </group>
  )
}

// ---- simple low-poly person ----
function Person({ pos, rot = 0, shirt, mats, hat = false }: { pos: Vec3; rot?: number; shirt: Mat; mats: Mats; hat?: boolean }) {
  return <group position={pos} rotation={[0, rot, 0]}>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * .105, .46, 0]} material={mats.pants} castShadow><capsuleGeometry args={[.075, .67, 5, 10]} /></mesh>
      <B size={[.145, .09, .28]} pos={[side * .105, .045, .035]} mat={mats.wheel} />
      <mesh position={[side * .255, 1.06, 0]} rotation={[0, 0, side * .12]} material={shirt} castShadow><capsuleGeometry args={[.06, .42, 5, 10]} /></mesh>
      <mesh position={[side * .29, .78, 0]} material={mats.skin}><sphereGeometry args={[.055, 12, 8]} /></mesh>
    </group>)}
    <mesh position={[0, 1.13, 0]} scale={[1, 1, .58]} material={shirt} castShadow><capsuleGeometry args={[.2, .24, 6, 14]} /></mesh>
    <mesh position={[0, 1.52, 0]} scale={[.82, 1.12, .9]} material={mats.skin} castShadow><sphereGeometry args={[.13, 18, 12]} /></mesh>
    {hat && <group position={[0, 1.65, 0]}>
      <mesh material={mats.hat} castShadow><sphereGeometry args={[.145, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh material={mats.hat}><cylinderGeometry args={[.18, .18, .025, 20]} /></mesh>
    </group>}
  </group>
}

// ---- onlookers watching the operation ----
function People({ mats }: { mats: Mats }) {
  return (
    <group>
      <Person pos={[15.6, .12, -4.5]} rot={-Math.PI / 2 - 0.3} shirt={mats.shirtA} mats={mats} hat />
      <Person pos={[16.4, .12, -3.6]} rot={-Math.PI / 2 - 0.5} shirt={mats.shirtD} mats={mats} />
      <Person pos={[16, .12, -5.9]} rot={-Math.PI / 2 + 0.2} shirt={mats.shirtB} mats={mats} hat />
      <Person pos={[-3, 0, -7.5]} rot={0.35} shirt={mats.shirtC} mats={mats} hat />
      <Person pos={[-1.4, 0, -8] as Vec3} rot={0.1} shirt={mats.shirtA} mats={mats} />
    </group>
  )
}

// ---- forklift: ferries bales from the truck/door into storage, returns empty ----
const FK_PICK = 8.5 // grab point near the door/apron
const FK_DROP = -0.8 // set-down point in front of the storage zone
const FK_Z = -1.5 // internal lane

function Forklift({ mats, active }: { mats: Mats; active: boolean }) {
  const grp = useRef<THREE.Group>(null!)
  const carried = useRef<THREE.Group>(null!)
  const phase = useRef(0)
  useFrame((_, delta) => {
    if (!active || !grp.current) return
    phase.current += Math.min(delta, .1) / 28
    const t = phase.current % 1
    const movingIn = t < .5
    const progress = movingIn ? Math.min(1, t / .42) : 1 - Math.min(1, (t - .5) / .42)
    grp.current.position.x = THREE.MathUtils.lerp(6.5, -5.2, progress)
    // Reverse along the aisle without an impossible 180-degree turn in place.
    grp.current.rotation.y = Math.PI
    carried.current.visible = t < .46
  })
  return <group ref={grp} position={[6.5, FLOOR_TOP, -1.2]} rotation={[0, Math.PI, 0]}>
    {/* Generic 2.5 t vehicle: 2.62 m to fork face, 1.15 m wide, 2.11 m guard. */}
    <B size={[2.35, .43, 1.02]} pos={[-.15, .48, 0]} mat={mats.forkBody} />
    <B size={[.65, .6, 1.02]} pos={[-.95, .8, 0]} mat={mats.forkBody} />
    <B size={[.55, .12, .48]} pos={[-.35, 1.02, 0]} mat={mats.forkSeat} />
    <B size={[.12, .45, .48]} pos={[-.6, 1.22, 0]} mat={mats.forkSeat} />
    {[-.67, .53].flatMap(x => [-.48, .48].map(z => <B key={`${x}${z}`} size={[.045, 1.2, .045]} pos={[x, 1.48, z]} mat={mats.steelDark} />))}
    <B size={[1.3, .055, 1.08]} pos={[-.07, 2.0825, 0]} mat={mats.steelDark} />
    {[-.3, 0, .3].map(z => <B key={z} size={[1.22, .025, .025]} pos={[-.07, 2.05, z]} mat={mats.steelDark} />)}
    {[-.39, .39].map(z => <B key={z} size={[.11, 1.95, .09]} pos={[1.22, 1.08, z]} mat={mats.steelDark} />)}
    {[.4, .85, 1.4, 1.95].map(y => <B key={y} size={[.08, .045, .85]} pos={[1.2, y, 0]} mat={mats.steelDark} />)}
    {[-.29, .29].map(z => <B key={z} size={[1.07, .04, .1]} pos={[1.79, .24, z]} mat={mats.steelDark} />)}
    {[-.94, .85].flatMap(x => [-.47, .47].map(z => <group key={`${x}${z}`} position={[x, .3, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.wheel} castShadow><cylinderGeometry args={[.3, .3, .21, 28]} /></mesh>
      <mesh position={[0, 0, Math.sign(z) * .112]} rotation={[Math.PI / 2, 0, 0]} material={mats.hub}><cylinderGeometry args={[.13, .13, .016, 16]} /></mesh>
    </group>))}
    {/* Seated driver fits below the 2.11 m overhead guard. */}
    <mesh position={[-.3, 1.35, 0]} scale={[.8, 1, .75]} material={mats.shirtB} castShadow><capsuleGeometry args={[.18, .2, 5, 12]} /></mesh>
    <mesh position={[-.3, 1.76, 0]} material={mats.skin}><sphereGeometry args={[.12, 16, 12]} /></mesh>
    {[-.13, .13].map(z => <group key={z}>
      <B size={[.43, .14, .14]} pos={[-.05, 1.02, z]} mat={mats.pants} />
      <B size={[.14, .43, .14]} pos={[.13, .83, z]} mat={mats.pants} />
      <B size={[.3, .08, .08]} pos={[-.04, 1.37, z * 1.4]} mat={mats.shirtB} />
    </group>)}
    <mesh position={[.25, 1.4, 0]} rotation={[0, 0, .6]} material={mats.wheel}><torusGeometry args={[.14, .022, 8, 20]} /></mesh>
    <mesh position={[-.55, 2.17, 0]}><cylinderGeometry args={[.055, .055, .11, 16]} /><meshStandardMaterial color="#eba429" emissive="#b06413" emissiveIntensity={.3} /></mesh>
    <group ref={carried} position={[1.7, .32, 0]}>
      <B size={[1.05, .12, 1.05]} pos={[0, 0, 0]} mat={mats.truckBed} />
      {[0, 1, 2].flatMap(layer => [-.24, .24].map(z => <B key={`${layer}${z}`} size={[1, .36, .45]} pos={[0, .24 + layer * .36, z]} mat={mats.bale[layer]} />))}
    </group>
  </group>
}

// ---- trees ----
function Trees({ mats }: { mats: Mats }) {
  const list: [number, number, number][] = [
    [-22, 10, 1.2],
    [-26, 4, 1],
    [22, -12, 1.1],
    [30, 9, 1.3],
    [-18, -2, 0.9],
    [34, -3, 1],
    [-30, 13, 1.1],
    [40, 12, 1.2],
    [24, 18, 1],
  ]
  const leafGeo = useMemo(() => {
    // icosahedron faces don't share vertices → flat, faceted normals. Weld them so the
    // canopy shades as a soft rounded mass instead of low-poly facets.
    const ico = new THREE.IcosahedronGeometry(1, 3)
    ico.deleteAttribute('normal')
    ico.deleteAttribute('uv')
    const g = mergeVertices(ico)
    ico.dispose()
    const a = g.attributes.position
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i), y = a.getY(i), z = a.getZ(i)
      const r = 1 + .11 * Math.sin(x * 19 + y * 13) * Math.cos(z * 17 + y * 9)
      a.setXYZ(i, x * r, y * r, z * r)
    }
    g.computeVertexNormals(); return g
  }, [])
  useEffect(() => () => leafGeo.dispose(), [leafGeo])
  const blobs: [number, number, number, number][] = [
    [0, 3.0, 0, 1.5],
    [0.9, 3.6, 0.4, 1.0],
    [-0.7, 3.4, -0.5, 1.1],
    [0.2, 4.2, -0.3, 0.9],
  ]
  return (
    <group>
      {list.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.3 * s, 0]} material={mats.trunk} castShadow>
            <cylinderGeometry args={[0.25 * s, 0.35 * s, 2.6 * s, 8]} />
          </mesh>
          {blobs.map(([fx, fy, fz, fr], k) => (
            <mesh key={k} position={[fx * s, fy * s, fz * s]} scale={[fr * s, fr * s, fr * s]} geometry={leafGeo} material={mats.foliage[k % 3]} castShadow>
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ---- dimension lines + projected labels ----
function Dimensions({ visible }: { visible: boolean }) {
  const geo = useMemo(() => {
    const pts: number[] = []
    const add = (a: Vec3, b: Vec3) => pts.push(...a, ...b)
    // width (length) 18 m
    add([-9, 0.15, 8], [9, 0.15, 8])
    add([-9, 0.15, 7.5], [-9, 0.15, 8.5])
    add([9, 0.15, 7.5], [9, 0.15, 8.5])
    // depth 10 m
    add([12.5, 0.15, -5], [12.5, 0.15, 5])
    add([12, 0.15, -5], [13, 0.15, -5])
    add([12, 0.15, 5], [13, 0.15, 5])
    // clear height (floor → eave) 6.4 m
    add([-11.5, 0.6, 8], [-11.5, 7.0, 8])
    add([-12, 7.0, 8], [-11, 7.0, 8])
    add([-12, 0.6, 8], [-11, 0.6, 8])
    // floor → roof (ridge) 9.0 m
    add([-14, 0.6, 0], [-14, 9.6, 0])
    add([-14.5, 9.6, 0], [-13.5, 9.6, 0])
    add([-14.5, 0.6, 0], [-13.5, 0.6, 0])
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])

  if (!visible) return null
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#33403a" />
      </lineSegments>
      {dimLabels.map((d, i) => (
        <Html key={i} position={d.p} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '4px 9px',
              background: '#33403a',
              color: '#fff',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 11,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,.2)',
            }}
          >
            {d.t}
          </div>
        </Html>
      ))}
    </group>
  )
}

// ---- projected zone label pills ----
function ZoneLabels({ onSelect, selected }: { onSelect: (key: string) => void; selected: string | null }) {
  return (
    <>
      {zones.map((z: Zone, index) => (
        <Html key={z.key} position={z.pos} center zIndexRange={[2, 1]} style={{ pointerEvents: 'none' }}>
          <button
            className={`zone-marker${selected === z.key ? ' is-selected' : ''}`}
            aria-label={`${z.th} / ${z.label}`}
            aria-pressed={selected === z.key}
            title={`${z.th} / ${z.label}`}
            onClick={() => onSelect(z.key)}
            style={{ '--zone-color': z.color } as React.CSSProperties}
          >
            {String(index + 1).padStart(2, '0')}
          </button>
        </Html>
      ))}
    </>
  )
}

// ---- post-processing: contact shadows in corners (AO), soft highlight glow, vignette ----
// The composer renders off-screen and switches the renderer to NoToneMapping, so ACES
// is re-applied here as the last colour step (otherwise highlights clip and colours wash).
// On touch devices (phones/tablets) the GPU-heavy AO + bloom are skipped; the composer
// itself stays so ACES still applies to the sky the same way on every device.
// ponytail: "coarse pointer" is a proxy for a weaker mobile GPU — switch to a frame-time
// check if some desktops stutter or some tablets could afford the full set.
const RICH_EFFECTS = typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches

function Effects() {
  const rich = RICH_EFFECTS
  return rich ? (
    <EffectComposer key="rich" multisampling={4}>
      <N8AO halfRes aoRadius={0.9} distanceFalloff={1} intensity={1.4} quality="medium" />
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.3} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.38} />
    </EffectComposer>
  ) : (
    <EffectComposer key="lite" multisampling={0}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.38} />
    </EffectComposer>
  )
}

export default function Scene({
  state,
  controllerRef,
  onSelectZone,
  onRecorded,
}: {
  state: SceneState
  controllerRef: React.MutableRefObject<CameraController | null>
  onSelectZone: (key: string) => void
  onRecorded: (clip: Blob | null) => void
}) {
  const mats = useMaterials()
  return (
    <>
      <Rig controllerRef={controllerRef} rotate={state.rotate} recording={state.recording} onRecorded={onRecorded} />
      <Weather weather={state.weather} time={state.time} />
      <Site mats={mats} />
      <Structure mats={mats} />
      <Roof mats={mats} />
      <Doors mats={mats} open={state.doorsOpen} />
      <SideWalls mats={mats} open={state.wallsOpen} />
      <DetailedBales layers={state.layers} />
      <ConstructionDetails />
      <Truck mats={mats} />
      <Forklift mats={mats} active={state.activity && state.doorsOpen} />
      <People mats={mats} />
      <Trees mats={mats} />
      <Dimensions visible={state.dims} />
      {state.labels && <ZoneLabels onSelect={onSelectZone} selected={state.selected} />}
      <Effects />
    </>
  )
}
