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
const mk = (c: string, o: { m?: number; r?: number; side?: THREE.Side } = {}) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(c),
    roughness: o.r ?? 0.85,
    metalness: o.m ?? 0,
    ...(o.side ? { side: o.side } : {}),
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
      dirtPad: mk('#c3a87f', { r: 0.98 }),
      slab: mk('#cfc9ba', { r: 0.92 }),
      ramp: mk('#c4beac', { r: 0.95 }),
      drainCh: mk('#5d6258', { r: 0.9 }),
      road: mk('#b89b6f', { r: 0.98 }),
      canalBank: mk('#bda57b', { r: 0.97 }),
      canalWater: mk('#5fa0c4', { m: 0.25, r: 0.18 }),
      paddy: mk('#6fa83c', { r: 0.95 }),
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
      truckCab: mk('#2f5f8c', { m: 0.3, r: 0.5 }),
      truckBed: mk('#6a6f73', { m: 0.3, r: 0.6 }),
      wheel: mk('#23262a', { r: 0.7 }),
      forkBody: mk('#d9821f', { m: 0.3, r: 0.5 }),
      trunk: mk('#6b4f2a', { r: 0.95 }),
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
  const paddies = useMemo(() => {
    const out: Vec3[] = []
    const bunds: { size: Vec3; pos: Vec3 }[] = []
    for (let px = -2; px <= 1; px++) {
      for (let pz = 0; pz <= 2; pz++) {
        const cx = -30 + px * 16
        const cz = -16 - pz * 15
        out.push([cx, 0.09, cz])
        bunds.push({ size: [15.4, 0.26, 0.4], pos: [cx, 0.13, cz - 7] })
        bunds.push({ size: [0.4, 0.26, 14], pos: [cx - 7.5, 0.13, cz] })
      }
    }
    const far: Vec3[] = []
    for (let pz = -1; pz <= 1; pz++) far.push([46, 0.09, -6 + pz * 14])
    return { out, bunds, far }
  }, [])

  return (
    <group>
      {/* grass plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.grass} receiveShadow>
        <planeGeometry args={[300, 300]} />
      </mesh>
      {/* dirt pad */}
      <B size={[30, 0.12, 17]} pos={[0, 0.06, 0]} mat={mats.dirtPad} />
      {/* raised concrete slab */}
      <B size={[21.4, 0.6, 11]} pos={[0, 0.3, 0]} mat={mats.slab} />
      {/* front loading ramp */}
      <B size={[4.4, 0.35, 5]} pos={[12.6, 0.3, 0]} rot={[0, 0, Math.atan2(0.55, 4.4)]} mat={mats.ramp} />
      {/* drainage channels */}
      {(
        [
          [0, 6.3, 22, 0.5],
          [0, -6.3, 22, 0.5],
          [11.2, 0, 0.5, 12.6],
          [-11.2, 0, 0.5, 12.6],
        ] as const
      ).map(([x, z, w, d], i) => (
        <B key={i} size={[w, 0.12, d]} pos={[x, 0.07, z]} mat={mats.drainCh} cast={false} />
      ))}
      {/* dirt access road */}
      <B size={[9, 0.06, 52]} pos={[20, 0.09, 12]} mat={mats.road} cast={false} />
      <B size={[9, 0.06, 40]} pos={[17, 0.09, 9.5]} rot={[0, Math.PI / 2, 0]} mat={mats.road} cast={false} />
      {/* irrigation canal */}
      <B size={[90, 0.5, 3.2]} pos={[0, 0.1, 16.5]} mat={mats.canalBank} cast={false} />
      <B size={[90, 0.4, 2]} pos={[0, 0.0, 16.5]} mat={mats.canalWater} cast={false} />
      {/* rice paddies */}
      {paddies.out.map((p, i) => (
        <B key={`p${i}`} size={[15, 0.18, 14]} pos={p} mat={mats.paddy} cast={false} />
      ))}
      {paddies.bunds.map((b, i) => (
        <B key={`b${i}`} size={b.size} pos={b.pos} mat={mats.bund} cast={false} />
      ))}
      {paddies.far.map((p, i) => (
        <B key={`f${i}`} size={[16, 0.18, 13]} pos={p} mat={mats.paddy} cast={false} />
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
        <B key={`eb${z}`} size={[21.5, 0.3, 0.3]} pos={[0, EAVE, z]} mat={mats.steel} />
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
          return <B key={`pu${t}_${s}`} size={[21.6, 0.1, 0.1]} pos={[0, y, z]} mat={mats.steelDark} />
        }),
      )}
      <B size={[21.6, 0.12, 0.12]} pos={[0, RIDGE, 0]} mat={mats.steelDark} />
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
  const roofLenX = 20 + ohX * 2
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
        <mesh key={`g${sx}`} geometry={gableGeo} material={mats.gable} position={[sx * 10, 0, 0]} castShadow receiveShadow />
      ))}
      {/* gutters */}
      {[-1, 1].map((s) => (
        <B key={`gut${s}`} size={[20.6, 0.18, 0.22]} pos={[0, EAVE - 0.18, s * (5 + ohZ - 0.1)]} mat={mats.gutter} />
      ))}
      {/* downpipes */}
      {(
        [
          [-10.1, 5.9],
          [10.1, 5.9],
          [-10.1, -5.9],
          [10.1, -5.9],
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
  const doorH = 4.0
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
        <group key={i} ref={(el) => (leaves.current[i] = el)} position={[10, 0, c.hz]}>
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
  const wallH = 4.1
  const doorY0 = FLOOR_TOP
  const bays = [-8, -4, 0, 4, 8]

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
            <B size={[3.7, wallH, 0.08]} pos={[0, -wallH / 2, 0]} mat={mats.panel} />
            {[-1, 0, 1].map((k) => (
              <B key={k} size={[3.7, 0.1, 0.05]} pos={[0, -wallH / 2 + k * 1.1, 0.04]} mat={mats.doorRib} />
            ))}
          </group>
          {/* roll drum at the eave (static) */}
          <mesh position={[p.bx, doorY0 + wallH + 0.12, p.sz * 5]} rotation={[0, 0, Math.PI / 2]} material={mats.frame} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3.75, 12]} />
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
    // main storage block (4 layers, staggered)
    for (let L = 0; L < 4; L++) {
      const yy = slabY + 0.43 + L * 0.86
      const off = L % 2 ? 0.45 : 0
      for (let cx = 0; cx < 4; cx++) {
        for (let rz = 0; rz < 7; rz++) {
          const x = -9.0 + cx * 2.05 + off
          const z = -3.4 + rz * 1.02
          if (x > -1.3) continue
          push(x, yy, z)
        }
      }
    }
    // secondary 2-high stack
    for (let L = 0; L < 2; L++) {
      for (let rz = 0; rz < 5; rz++) push(1.2, slabY + 0.43 + L * 0.86, -2.2 + rz * 1.02)
    }
    // staged on the loading apron
    push(11.2, 0.5, -2.0)
    push(11.2, 0.5, -1.0)
    push(11.2, 1.36, -1.5)
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

// ---- parked truck ----
function Truck({ mats }: { mats: Mats }) {
  const wheels: Vec3[] = [
    [-2.2, 1, 0],
    [-2.2, -1, 0],
    [1.2, 1, 0],
    [1.2, -1, 0],
    [2.6, 1, 0],
    [2.6, -1, 0],
  ]
  return (
    <group position={[16.5, 0, -1.5]}>
      <B size={[2.4, 2.0, 2.4]} pos={[-2.2, 1.5, 0]} mat={mats.truckCab} />
      <B size={[5.2, 0.5, 2.6]} pos={[1.0, 0.95, 0]} mat={mats.truckBed} />
      <B size={[0.1, 0.9, 2.0]} pos={[-3.4, 1.7, 0]} mat={mats.win} />
      {[-0.4, 1.5].map((bx) =>
        [-0.7, 0.7].map((bz) => (
          <B key={`${bx}_${bz}`} size={[1.7, 0.8, 0.9]} pos={[bx, 1.6, bz]} mat={mats.bale[(Math.abs(bx) + bz + 2) % 5 | 0]} />
        )),
      )}
      {wheels.map(([wx, , wz], i) => (
        <mesh key={i} position={[wx, 0.55, wz * 1.25]} rotation={[Math.PI / 2, 0, 0]} material={mats.wheel} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.45, 16]} />
        </mesh>
      ))}
    </group>
  )
}

// ---- forklift shuttling along the internal lane ----
function Forklift({ mats, active }: { mats: Mats; active: boolean }) {
  const grp = useRef<THREE.Group>(null!)
  const phase = useRef(0)
  useFrame(() => {
    if (!active || !grp.current) return
    phase.current += 0.006
    const ph = (Math.sin(phase.current) + 1) / 2
    grp.current.position.x = -3 + ph * 10.5
    grp.current.rotation.y = Math.cos(phase.current) >= 0 ? 0 : Math.PI
  })
  return (
    <group ref={grp} position={[4.5, FLOOR_TOP, -1.5]} rotation={[0, Math.PI, 0]}>
      <B size={[1.4, 1.2, 1.2]} pos={[0, 0.95, 0]} mat={mats.forkBody} />
      <B size={[0.18, 2.2, 1.0]} pos={[0.8, 1.4, 0]} mat={mats.steelDark} />
      <B size={[1.0, 0.12, 0.9]} pos={[1.3, 0.55, 0]} mat={mats.steelDark} />
      <B size={[1.7, 0.8, 0.9]} pos={[1.5, 1.05, 0]} mat={mats.bale[0]} />
      {(
        [
          [-0.4, 0.55],
          [-0.4, -0.55],
          [0.7, 0.55],
          [0.7, -0.55],
        ] as const
      ).map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.4, wz]} rotation={[Math.PI / 2, 0, 0]} material={mats.wheel} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.35, 14]} />
        </mesh>
      ))}
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
    add([-10, 0.15, 8], [10, 0.15, 8])
    add([-10, 0.15, 7.5], [-10, 0.15, 8.5])
    add([10, 0.15, 7.5], [10, 0.15, 8.5])
    add([13.5, 0.15, -5], [13.5, 0.15, 5])
    add([13, 0.15, -5], [14, 0.15, -5])
    add([13, 0.15, 5], [14, 0.15, 5])
    add([-12.5, 0, 8], [-12.5, 5, 8])
    add([-13, 5, 8], [-12, 5, 8])
    add([-13, 0, 8], [-12, 0, 8])
    add([-15, 0, 0], [-15, 7.6, 0])
    add([-15.5, 7.6, 0], [-14.5, 7.6, 0])
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
      <Trees mats={mats} />
      <Dimensions visible={state.dims} />
      {state.labels && <ZoneLabels onSelect={onSelectZone} />}
    </>
  )
}
