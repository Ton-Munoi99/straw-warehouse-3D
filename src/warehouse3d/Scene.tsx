import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  COL_XS,
  COL_ZS,
  EAVE,
  FLOOR_TOP,
  RIDGE,
  SKY,
  Vec3,
  View,
  Zone,
  dimLabels,
  zones,
} from './data'

export interface SceneState {
  rotate: boolean
  labels: boolean
  selected: string | null
  doorsOpen: boolean
  wallsOpen: boolean
  weather: 'sunny' | 'rainy'
  activity: boolean
  dims: boolean
}

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
  return useMemo(() => {
    const bale = ['#cda23f', '#c79a36', '#d3ab48', '#c4972f', '#d8b257'].map((c) =>
      mk(c, { r: 0.96 }),
    )
    const foliage = ['#4f7d39', '#5e8f43', '#447033'].map((c) => mk(c, { r: 0.95 }))
    return {
      steel: mk('#828a93', { m: 0.65, r: 0.42 }),
      steelDark: mk('#5f666e', { m: 0.6, r: 0.5 }),
      grass: mk('#7ca64d', { r: 0.97 }),
      apron: mk('#c2bcab', { r: 0.9, po: -1 }), // concrete yard around the warehouse
      greenPatch: mk('#83a64a', { r: 0.96, po: -3 }), // grass patches for balance
      slab: mk('#cfc9ba', { r: 0.92 }),
      ramp: mk('#c4beac', { r: 0.95 }),
      drainCh: mk('#565b52', { r: 0.9, po: -5 }),
      road: mk('#b89b6f', { r: 0.98, po: -2 }),
      canalBank: mk('#bda57b', { r: 0.97 }),
      canalWater: mk('#5fa0c4', { m: 0.25, r: 0.18 }),
      paddy: mk('#6fa83c', { r: 0.95 }),
      paddyGreen2: mk('#5f9a34', { r: 0.95 }),
      paddyGold: mk('#dcc24f', { r: 0.9 }),
      paddyGold2: mk('#cdb144', { r: 0.91 }),
      paddyGold3: mk('#e6d06a', { r: 0.9 }),
      bund: mk('#a98f64', { r: 0.97 }),
      roofMetal: mk('#c6cace', { m: 0.45, r: 0.5 }),
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
function Rig({
  controllerRef,
  rotate,
}: {
  controllerRef: React.MutableRefObject<CameraController | null>
  rotate: boolean
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as any
  const tween = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3(), active: false })

  useEffect(() => {
    if (!controls) return
    controllerRef.current = {
      setView: (v) => {
        tween.current.pos.set(...v.pos)
        tween.current.look.set(...v.look)
        tween.current.active = true
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

  useFrame(() => {
    if (!controls) return
    controls.autoRotate = rotate
    if (tween.current.active) {
      camera.position.lerp(tween.current.pos, 0.07)
      controls.target.lerp(tween.current.look, 0.07)
      if (camera.position.distanceTo(tween.current.pos) < 0.4) tween.current.active = false
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
      autoRotateSpeed={0.9}
    />
  )
}

// ---- weather: background, fog, light intensities + rain ----
function Weather({ weather }: { weather: 'sunny' | 'rainy' }) {
  const scene = useThree((s) => s.scene)
  const sun = useRef<THREE.DirectionalLight>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const amb = useRef<THREE.AmbientLight>(null!)
  const rain = useRef<THREE.Points>(null!)

  const rainPos = useMemo(() => {
    const RN = 1800
    const p = new Float32Array(RN * 3)
    for (let i = 0; i < RN; i++) {
      p[i * 3] = (Math.random() - 0.5) * 72
      p[i * 3 + 1] = Math.random() * 34
      p[i * 3 + 2] = (Math.random() - 0.5) * 72
    }
    return p
  }, [])

  useEffect(() => {
    const rainy = weather === 'rainy'
    scene.background = rainy ? SKY.rainy : SKY.sunny
    if (!scene.fog) scene.fog = new THREE.Fog('#d2e8f2', 80, 200)
    const fog = scene.fog as THREE.Fog
    fog.color.copy(rainy ? SKY.rainy : SKY.sunny)
    fog.near = rainy ? 42 : 80
    fog.far = rainy ? 150 : 200
    if (sun.current) {
      sun.current.intensity = rainy ? 0.35 : 1.2
      sun.current.color.set(rainy ? '#c2cad1' : '#fff1d6')
    }
    if (hemi.current) {
      hemi.current.intensity = rainy ? 0.42 : 0.6
      hemi.current.color.set(rainy ? '#aab6bf' : '#cfe8ff')
    }
    if (amb.current) amb.current.intensity = rainy ? 0.32 : 0.22
  }, [weather, scene])

  useFrame(() => {
    if (weather !== 'rainy' || !rain.current) return
    const p = rainPos
    for (let i = 1; i < p.length; i += 3) {
      p[i] -= 0.6
      if (p[i] < 0) p[i] = 34
    }
    rain.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#cfe8ff', '#6f7048', 0.6]} />
      <ambientLight ref={amb} intensity={0.22} />
      <directionalLight
        ref={sun}
        color="#fff1d6"
        intensity={1.2}
        position={[36, 46, 20]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={1}
        shadow-camera-far={170}
        shadow-bias={-0.0004}
      />
      <points ref={rain} visible={weather === 'rainy'}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rainPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#9fb4c4"
          size={0.17}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>
    </>
  )
}

// ---- ground & surrounding site ----
function Site({ mats }: { mats: Mats }) {
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
      <B size={[4.4, 0.35, 5]} pos={[11.6, 0.3, 0]} rot={[0, 0, Math.atan2(0.55, 4.4)]} mat={mats.ramp} />
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
      <B size={[90, 0.5, 3.2]} pos={[0, 0.1, 16.5]} mat={mats.canalBank} cast={false} />
      <B size={[90, 0.4, 2]} pos={[0, 0.0, 16.5]} mat={mats.canalWater} cast={false} />
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
            <B size={[0.32, EAVE - FLOOR_TOP, 0.32]} pos={[x, FLOOR_TOP + (EAVE - FLOOR_TOP) / 2, z]} mat={mats.steel} />
            <B size={[0.6, 0.1, 0.6]} pos={[x, FLOOR_TOP + 0.05, z]} mat={mats.steelDark} />
          </group>
        )),
      )}
      {/* eave beams along X */}
      {COL_ZS.map((z) => (
        <B key={`eb${z}`} size={[19.5, 0.3, 0.3]} pos={[0, EAVE, z]} mat={mats.steel} />
      ))}
      {/* tie beams along Z */}
      {COL_XS.map((x) => (
        <B key={`tb${x}`} size={[0.26, 0.26, 10]} pos={[x, EAVE, 0]} mat={mats.steel} />
      ))}
      {/* trusses per frame line */}
      {COL_XS.map((x) => (
        <group key={`tr${x}`}>
          <B size={[0.2, 0.2, 10]} pos={[x, EAVE, 0]} mat={mats.steelDark} />
          <B size={[0.16, RIDGE - EAVE, 0.16]} pos={[x, EAVE + (RIDGE - EAVE) / 2, 0]} mat={mats.steelDark} />
          {[-1, 1].map((s) => (
            <B
              key={s}
              size={[0.2, 0.18, chordLen]}
              pos={[x, (EAVE + RIDGE) / 2, s * 2.5]}
              rot={[s * ang, 0, 0]}
              mat={mats.steel}
            />
          ))}
          {[-2.5, 2.5].map((z) => {
            const yTop = EAVE + (1 - Math.abs(z) / 5) * (RIDGE - EAVE)
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
          return <B key={`pu${t}_${s}`} size={[19.6, 0.1, 0.1]} pos={[0, y, z]} mat={mats.steelDark} />
        }),
      )}
      <B size={[19.6, 0.12, 0.12]} pos={[0, RIDGE, 0]} mat={mats.steelDark} />
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
            size={[roofLenX, 0.16, slopeLen]}
            pos={[0, yMidPanel, s * (runZ / 2)]}
            rot={[s * ang, 0, 0]}
            mat={mats.roofMetal}
          />
          {Array.from({ length: 19 }, (_, k) => k - 9).map((i) => (
            <B
              key={i}
              size={[0.05, 0.04, slopeLen]}
              pos={[i * 1.15, yMidPanel + 0.1, s * (runZ / 2)]}
              rot={[s * ang, 0, 0]}
              mat={mats.rib}
              cast={false}
            />
          ))}
        </group>
      ))}
      {/* ridge cap */}
      <B size={[roofLenX + 0.1, 0.26, 0.55]} pos={[0, RIDGE + 0.16, 0]} mat={mats.ridgeCap} />
      {/* gable end triangles */}
      {[-1, 1].map((sx) => (
        <mesh key={`g${sx}`} geometry={gableGeo} material={mats.gable} position={[sx * 9, 0, 0]} castShadow receiveShadow />
      ))}
      {/* gutters */}
      {[-1, 1].map((s) => (
        <B key={`gut${s}`} size={[18.6, 0.18, 0.22]} pos={[0, EAVE - 0.18, s * (5 + ohZ - 0.1)]} mat={mats.gutter} />
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
        <B key={`dp${i}`} size={[0.16, EAVE, 0.16]} pos={[x, EAVE / 2, z]} mat={mats.downpipe} />
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
          <B size={[0.12, doorH, 4.7]} pos={[0, c.cy, c.cz]} mat={mats.panel} />
          {[doorY0 + 0.16, doorY0 + doorH - 0.16].map((ry, k) => (
            <B key={k} size={[0.16, 0.2, 4.8]} pos={[0, ry, c.cz]} mat={mats.frame} />
          ))}
          {[-1.6, -0.55, 0.55, 1.6].map((o, k) => (
            <B key={`r${k}`} size={[0.15, doorH - 0.5, 0.07]} pos={[0, c.cy, c.cz + o]} mat={mats.doorRib} />
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
            <B size={[3.3, wallH, 0.08]} pos={[0, -wallH / 2, 0]} mat={mats.panel} />
            {[-2, -1, 0, 1, 2].map((k) => (
              <B key={k} size={[3.3, 0.1, 0.05]} pos={[0, -wallH / 2 + k * 1.2, 0.04]} mat={mats.doorRib} />
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

// ---- straw bales ----
function Bales({ mats }: { mats: Mats }) {
  const slabY = FLOOR_TOP
  const bales = useMemo(() => {
    const out: { pos: Vec3; mat: number }[] = []
    let n = 0
    const push = (x: number, y: number, z: number) => {
      out.push({ pos: [x, y, z], mat: n % 5 })
      n++
    }
    // main storage block — taller clear height now allows 5 staggered layers
    for (let L = 0; L < 5; L++) {
      const yy = slabY + 0.43 + L * 0.86
      const off = L % 2 ? 0.45 : 0
      for (let cx = 0; cx < 4; cx++) {
        for (let rz = 0; rz < 7; rz++) {
          const x = -8.3 + cx * 2.05 + off
          const z = -3.4 + rz * 1.02
          if (x > -1.5) continue
          push(x, yy, z)
        }
      }
    }
    // secondary 3-high stack on the +z side, clear of the forklift lane (z=-1.5)
    for (let L = 0; L < 3; L++) {
      for (let rz = 0; rz < 4; rz++) push(-0.5, slabY + 0.43 + L * 0.86, 1.3 + rz * 1.02)
    }
    // staged on the loading apron, just inside the door
    push(10.2, 0.5, -2.6)
    push(10.2, 0.5, -3.6)
    push(10.2, 1.36, -3.1)
    return out
  }, [slabY])

  return (
    <group>
      {bales.map((b, i) => (
        <B key={i} size={[1.9, 0.85, 0.95]} pos={b.pos} mat={mats.bale[b.mat]} />
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
      <mesh position={[0, Math.sign(pos[2] || 1) * 0.21, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.hub}>
        <cylinderGeometry args={[r * 0.42, r * 0.42, 0.06, 12]} />
      </mesh>
    </group>
  )
}

// ---- parked delivery truck (stake-bed, facing the door, carrying bales) ----
function Truck({ mats }: { mats: Mats }) {
  // local frame: cab toward −x (forward), flatbed behind toward +x
  return (
    <group position={[14, 0, 2.4]} rotation={[0, 0, 0]}>
      {/* chassis frame */}
      <B size={[7.2, 0.32, 1.9]} pos={[-0.3, 0.78, 0]} mat={mats.truckChassis} />
      {/* cab */}
      <B size={[2.0, 1.55, 2.45]} pos={[-2.7, 1.78, 0]} mat={mats.truckCab} />
      <B size={[1.05, 0.85, 2.35]} pos={[-3.85, 1.35, 0]} mat={mats.truckCab} />
      {/* windshield + side windows */}
      <B size={[0.09, 0.7, 2.0]} pos={[-3.25, 2.05, 0]} mat={mats.win} />
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
      {/* bales loaded on the bed (delivery) */}
      {[-0.3, 1.4].map((bx, ix) =>
        [-0.65, 0.65].map((bz, iz) => (
          <B key={`${bx}_${bz}`} size={[1.7, 0.8, 0.95]} pos={[bx, 1.62, bz]} mat={mats.bale[(ix + iz + 2) % 5]} />
        )),
      )}
      <B size={[1.7, 0.8, 0.95]} pos={[0.55, 2.42, 0]} mat={mats.bale[1]} />
      {/* axles: front + rear dual */}
      {([[-3.0, -1.25], [-3.0, 1.25], [1.0, -1.3], [1.0, 1.3], [2.5, -1.3], [2.5, 1.3]] as const).map(([wx, wz], i) => (
        <Wheel key={i} pos={[wx, 0.55, wz]} mats={mats} />
      ))}
    </group>
  )
}

// ---- simple low-poly person ----
function Person({ pos, rot = 0, shirt, mats, hat = false }: { pos: Vec3; rot?: number; shirt: Mat; mats: Mats; hat?: boolean }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <B size={[0.18, 0.7, 0.22]} pos={[-0.12, 0.35, 0]} mat={mats.pants} />
      <B size={[0.18, 0.7, 0.22]} pos={[0.12, 0.35, 0]} mat={mats.pants} />
      <B size={[0.5, 0.7, 0.28]} pos={[0, 1.05, 0]} mat={shirt} />
      <B size={[0.14, 0.6, 0.16]} pos={[-0.32, 1.05, 0]} mat={shirt} />
      <B size={[0.14, 0.6, 0.16]} pos={[0.32, 1.05, 0]} mat={shirt} />
      <mesh position={[0, 1.58, 0]} material={mats.skin} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      {hat && (
        <mesh position={[0, 1.72, 0]} material={mats.hat} castShadow>
          <coneGeometry args={[0.3, 0.2, 14]} />
        </mesh>
      )}
    </group>
  )
}

// ---- onlookers watching the operation ----
function People({ mats }: { mats: Mats }) {
  return (
    <group>
      <Person pos={[13.5, 0, -4.5]} rot={-Math.PI / 2 - 0.3} shirt={mats.shirtA} mats={mats} hat />
      <Person pos={[14.4, 0, -3.6]} rot={-Math.PI / 2 - 0.5} shirt={mats.shirtD} mats={mats} />
      <Person pos={[12.8, 0, -6.2]} rot={-Math.PI / 2 + 0.2} shirt={mats.shirtB} mats={mats} hat />
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
  const placed = useRef<THREE.Mesh>(null!)
  const phase = useRef(0)

  useFrame(() => {
    if (!active || !grp.current) return
    phase.current += 0.0032
    const t = phase.current % 1
    const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.min(1, Math.max(0, k))

    let x = FK_PICK
    let loaded = false
    if (t < 0.08) {
      x = FK_PICK
      loaded = true // grabbed a bale
    } else if (t < 0.42) {
      x = lerp(FK_PICK, FK_DROP, (t - 0.08) / 0.34)
      loaded = true
    } else if (t < 0.5) {
      x = FK_DROP
      loaded = false // set down
    } else if (t < 0.84) {
      x = lerp(FK_DROP, FK_PICK, (t - 0.5) / 0.34)
      loaded = false // returning empty
    } else {
      x = FK_PICK
      loaded = false
    }
    grp.current.position.x = x
    grp.current.rotation.y = t < 0.46 ? Math.PI : 0 // face travel direction (forks first)
    if (carried.current) carried.current.visible = loaded
    // the just-placed bale appears at the drop after set-down, hides as the next is carried in
    if (placed.current) placed.current.visible = t >= 0.46 && t < 0.92
  })

  return (
    <group>
      <group ref={grp} position={[FK_PICK, FLOOR_TOP, FK_Z]} rotation={[0, Math.PI, 0]}>
        {/* counterweight body */}
        <B size={[1.5, 1.0, 1.2]} pos={[-0.15, 0.85, 0]} mat={mats.forkBody} />
        <B size={[1.0, 0.5, 1.0]} pos={[-0.4, 1.5, 0]} mat={mats.forkBody} />
        {/* seat */}
        <B size={[0.5, 0.5, 0.7]} pos={[-0.1, 1.45, 0]} mat={mats.forkSeat} />
        {/* ROPS overhead guard */}
        {([[0.35, 0.5], [0.35, -0.5], [-0.55, 0.5], [-0.55, -0.5]] as const).map(([px, pz], i) => (
          <B key={i} size={[0.08, 1.4, 0.08]} pos={[px, 2.1, pz]} mat={mats.steelDark} />
        ))}
        <B size={[1.1, 0.08, 1.2]} pos={[-0.1, 2.8, 0]} mat={mats.steelDark} />
        {/* driver */}
        <Person pos={[-0.1, 1.55, 0]} rot={Math.PI} shirt={mats.shirtB} mats={mats} hat />
        {/* mast + forks */}
        <B size={[0.18, 2.4, 1.0]} pos={[0.75, 1.5, 0]} mat={mats.steelDark} />
        <B size={[1.0, 0.12, 0.28]} pos={[1.3, 0.35, 0.32]} mat={mats.steelDark} />
        <B size={[1.0, 0.12, 0.28]} pos={[1.3, 0.35, -0.32]} mat={mats.steelDark} />
        {/* carried bale (toggles with load state) */}
        <group ref={carried}>
          <B size={[1.7, 0.8, 0.9]} pos={[1.45, 0.85, 0]} mat={mats.bale[2]} />
        </group>
        {/* wheels */}
        {([[-0.5, 0.55], [-0.5, -0.55], [0.75, 0.5], [0.75, -0.5]] as const).map(([wx, wz], i) => (
          <mesh key={i} position={[wx, 0.4, wz]} rotation={[Math.PI / 2, 0, 0]} material={mats.wheel} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.35, 14]} />
          </mesh>
        ))}
      </group>
      {/* freshly-placed bale left at the storage edge */}
      <mesh ref={placed} position={[FK_DROP, FLOOR_TOP + 0.45, FK_Z]} material={mats.bale[3]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.85, 0.9]} />
      </mesh>
    </group>
  )
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
            <mesh key={k} position={[fx * s, fy * s, fz * s]} material={mats.foliage[k % 3]} castShadow>
              <icosahedronGeometry args={[fr * s, 0]} />
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
function ZoneLabels({ onSelect }: { onSelect: (key: string) => void }) {
  return (
    <>
      {zones.map((z: Zone) => (
        <Html key={z.key} position={z.pos} center style={{ pointerEvents: 'none' }}>
          <div style={{ transform: 'translateY(-100%)' }}>
            <button
              onClick={() => onSelect(z.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 11px',
                background: 'rgba(255,255,255,0.94)',
                border: `1px solid ${z.color}`,
                borderRadius: 20,
                boxShadow: '0 4px 14px rgba(20,40,25,0.16)',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                fontSize: 12,
                color: '#26342c',
                cursor: 'pointer',
                pointerEvents: 'auto',
                font: "700 12px 'Plus Jakarta Sans'",
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: z.color, flex: 'none' }} />
              {z.label}
            </button>
            <div style={{ width: 1, height: 14, background: z.color, margin: '0 auto', opacity: 0.7 }} />
          </div>
        </Html>
      ))}
    </>
  )
}

export default function Scene({
  state,
  controllerRef,
  onSelectZone,
}: {
  state: SceneState
  controllerRef: React.MutableRefObject<CameraController | null>
  onSelectZone: (key: string) => void
}) {
  const mats = useMaterials()
  return (
    <>
      <Rig controllerRef={controllerRef} rotate={state.rotate} />
      <Weather weather={state.weather} />
      <Site mats={mats} />
      <Structure mats={mats} />
      <Roof mats={mats} />
      <Doors mats={mats} open={state.doorsOpen} />
      <SideWalls mats={mats} open={state.wallsOpen} />
      <Bales mats={mats} />
      <Truck mats={mats} />
      <Forklift mats={mats} active={state.activity} />
      <People mats={mats} />
      <Trees mats={mats} />
      <Dimensions visible={state.dims} />
      {state.labels && <ZoneLabels onSelect={onSelectZone} />}
    </>
  )
}
