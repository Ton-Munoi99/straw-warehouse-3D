import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { COL_XS, COL_ZS, EAVE, FLOOR_TOP, Vec3 } from './data'

// Repeatable, locally generated material maps; no remote image dependencies.
export function surfaceTexture(kind: 'straw' | 'concrete' | 'earth' | 'metal') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const c = canvas.getContext('2d')!
  let seed = 1483
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  c.fillStyle = { straw: '#c6a567', concrete: '#c8c5bd', earth: '#a99672', metal: '#b9bec0' }[kind]
  c.fillRect(0, 0, 512, 512)
  for (let i = 0; i < (kind === 'straw' ? 17000 : 24000); i++) {
    const x = rand() * 512, y = rand() * 512, light = rand()
    c.strokeStyle = kind === 'straw' ? `rgba(${light > .5 ? '246,225,156' : '86,64,28'},${.15 + rand() * .5})` : `rgba(${light > .5 ? '255,255,255' : '42,38,30'},${rand() * .12})`
    c.lineWidth = kind === 'straw' ? .5 + rand() * 1.4 : .5
    c.beginPath(); c.moveTo(x, y)
    c.lineTo(x + (kind === 'straw' ? 6 + rand() * 48 : rand() * 3), y + (rand() - .5) * (kind === 'straw' ? 18 : 3)); c.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  if (kind === 'concrete' || kind === 'earth') texture.repeat.set(8, 8)
  return texture
}

export function Repeated({ geometry, material, positions }: { geometry: THREE.BufferGeometry; material: THREE.Material; positions: Vec3[] }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4()
    positions.forEach((p, i) => ref.current.setMatrixAt(i, matrix.makeTranslation(...p)))
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [positions])
  return <instancedMesh ref={ref} args={[geometry, material, positions.length]} castShadow receiveShadow />
}

export function DetailedBales() {
  const assets = useMemo(() => {
    const map = surfaceTexture('straw')
    const material = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: .012, roughness: .96, color: '#e5d4ad' })
    const twine = new THREE.MeshStandardMaterial({ color: '#d6d0b2', roughness: 1 })
    return { map, material, twine, box: new RoundedBoxGeometry(1, .36, .45, 2, .025), tie: new THREE.BoxGeometry(.009, .364, .456) }
  }, [])
  const positions = useMemo(() => {
    const bales: Vec3[] = [], ties: Vec3[] = []
    // 1.00 × 0.45 × 0.36 m illustrative small rectangular bale.
    // Two stacks with a continuous 3 m working aisle, plus a clear door apron.
    for (let layer = 0; layer < 10; layer++) for (let col = 0; col < 14; col++) {
      for (const z of [-4.2, -3.7, -3.2, .8, 1.3, 1.8, 2.3, 2.8, 3.3, 3.8, 4.3]) {
        const x = -8 + col * 1.035 + (layer % 2 ? .08 : 0)
        const y = FLOOR_TOP + .15 + .18 + layer * .366
        bales.push([x, y, z]); ties.push([x - .27, y, z], [x + .27, y, z])
      }
    }
    return { bales, ties }
  }, [])
  useEffect(() => () => { Object.values(assets).forEach(a => a.dispose()) }, [assets])
  return <group>
    <Repeated geometry={assets.box} material={assets.material} positions={positions.bales} />
    <Repeated geometry={assets.tie} material={assets.twine} positions={positions.ties} />
    {[-3.7, 2.55].map((z, i) => <mesh key={z} position={[-1.25, .675, z]} receiveShadow>
      <boxGeometry args={[14.6, .15, i ? 4.05 : 1.55]} /><meshStandardMaterial color="#827253" roughness={1} />
    </mesh>)}
  </group>
}

export function RiceRows({ tiles }: { tiles: { pos: Vec3; size: Vec3; mat: string }[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const data = useMemo(() => {
    const positions: { x: number; z: number; green: boolean }[] = []
    for (const tile of tiles) {
      if (Math.hypot(tile.pos[0], tile.pos[2]) > 68) continue
      for (let x = -.5 * tile.size[0] + .4; x < .5 * tile.size[0] - .4; x += .55) {
        for (let z = -.5 * tile.size[2] + .4; z < .5 * tile.size[2] - .4; z += .48) {
          positions.push({ x: tile.pos[0] + x, z: tile.pos[2] + z, green: tile.mat.startsWith('gr') })
        }
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -.09, 0, 0, .07, .58, .02, .04, 0, 0,
      0, 0, -.09, -.02, .63, .09, 0, 0, .05,
      -.06, 0, -.05, .16, .47, .11, .04, 0, .04,
    ], 3))
    geometry.computeVertexNormals()
    return { positions, geometry }
  }, [tiles])
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4(), color = new THREE.Color()
    data.positions.forEach((p, i) => {
      matrix.makeTranslation(p.x, .16, p.z)
      mesh.current.setMatrixAt(i, matrix)
      color.set(p.green ? (i % 3 ? '#889254' : '#a6ab68') : (i % 3 ? '#b9a66c' : '#cbb779'))
      mesh.current.setColorAt(i, color)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.instanceColor!.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [data])
  useEffect(() => () => data.geometry.dispose(), [data])
  return <instancedMesh ref={mesh} args={[data.geometry, undefined, data.positions.length]}>
    <meshStandardMaterial roughness={1} side={THREE.DoubleSide} />
  </instancedMesh>
}

function Box({ size, pos, color = '#626c6c' }: { size: Vec3; pos: Vec3; color?: string }) {
  return <mesh position={pos} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.7} /></mesh>
}

export function Sign({ pos, rotation = [0, 0, 0], width, height, thai, english, background = '#21483b' }: {
  pos: Vec3; rotation?: Vec3; width: number; height: number; thai: string; english: string; background?: string
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = Math.round(1536 * height / width)
    return new THREE.CanvasTexture(canvas)
  }, [width, height])
  useEffect(() => {
    let active = true
    const draw = () => {
      if (!active) return
      const canvas = texture.image as HTMLCanvasElement, c = canvas.getContext('2d')!, w = canvas.width, h = canvas.height
      c.fillStyle = background; c.fillRect(0, 0, w, h)
      c.strokeStyle = '#f5f0dc'; c.lineWidth = 5; c.strokeRect(15, 15, w - 30, h - 30)
      c.fillStyle = '#fffdf3'; c.textAlign = 'center'; c.textBaseline = 'middle'
      let font = Math.min(h * .34, 145)
      c.font = `600 ${font}px "Noto Sans Thai", Tahoma, sans-serif`
      while (c.measureText(thai).width > w * .9) { font -= 2; c.font = `600 ${font}px "Noto Sans Thai", Tahoma, sans-serif` }
      c.fillText(thai, w / 2, h * .39)
      c.font = `500 ${Math.min(h * .16, 54)}px Arial, sans-serif`; c.fillText(english, w / 2, h * .76)
      texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; texture.needsUpdate = true
    }
    draw(); document.fonts.load('600 60px "Noto Sans Thai"').then(draw)
    return () => { active = false }
  }, [texture, thai, english, background])
  useEffect(() => () => texture.dispose(), [texture])
  return <group position={pos} rotation={rotation}>
    <Box size={[width + .06, height + .06, .06]} pos={[0, 0, -.04]} color="#afb3af" />
    <mesh><planeGeometry args={[width, height]} /><meshStandardMaterial map={texture} roughness={.65} /></mesh>
    {[-1, 1].flatMap(x => [-1, 1].map(y => <mesh key={`${x}${y}`} position={[x * (width / 2 - .045), y * (height / 2 - .045), .009]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.012, .012, .015, 6]} /><meshStandardMaterial color="#c7cbd0" metalness={.7} roughness={.3} />
    </mesh>))}
  </group>
}

export function ConstructionDetails() {
  const grates = useMemo(() => {
    const p: Vec3[] = []
    for (let x = -9.9; x <= 10; x += .13) for (const z of [-6.3, 6.3]) p.push([x, .179, z])
    return p
  }, [])
  const assets = useMemo(() => ({ geo: new THREE.BoxGeometry(.028, .028, .46), mat: new THREE.MeshStandardMaterial({ color: '#8b9290', metalness: .65, roughness: .4 }) }), [])
  useEffect(() => () => { assets.geo.dispose(); assets.mat.dispose() }, [assets])
  return <group>
    <Repeated geometry={assets.geo} material={assets.mat} positions={grates} />
    {COL_XS.flatMap(x => COL_ZS.map(z => <group key={`${x}${z}`} position={[x, FLOOR_TOP, z]}>
      <Box pos={[0, .025, 0]} size={[.42, .05, .42]} color="#b9b6aa" />
      {[-.15, .15].flatMap(bx => [-.15, .15].map(bz => <mesh key={`${bx}${bz}`} position={[bx, .105, bz]}>
        <cylinderGeometry args={[.023, .023, .055, 6]} /><meshStandardMaterial color="#aeb2b0" metalness={.75} roughness={.3} />
      </mesh>))}
    </group>))}
    {[-6, -2, 2, 6].map(x => <Box key={x} pos={[x, .602, 0]} size={[.012, .002, 10.9]} color="#99998d" />)}
    {[-2.7, .3].map(z => <Box key={z} pos={[-.2, .607, z]} size={[17, .004, .08]} color="#ddbc44" />)}
    {[-6, -1, 4].map(x => <group key={x} position={[x, EAVE - .65, -1.2]}>
      <Box pos={[0, .32, 0]} size={[.015, .65, .015]} />
      <mesh><cylinderGeometry args={[.1, .24, .16, 24]} /><meshStandardMaterial color="#515856" metalness={.5} roughness={.4} /></mesh>
      <mesh position={[0, -.083, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[.21, 24]} /><meshStandardMaterial color="#fff5d2" emissive="#fff5d2" emissiveIntensity={.4} /></mesh>
    </group>)}
    <Sign pos={[9.13, 7.75, 0]} rotation={[0, Math.PI / 2, 0]} width={5.4} height={.95} thai="ศูนย์รวบรวมและเก็บฟาง" english="RICE STRAW COLLECTION & STORAGE" />
    {[-6, -3.6].map(x => <Box key={x} size={[.025, .66, .025]} pos={[x, 6.69, 5.12]} />)}
    <Sign pos={[-4.8, 6.05, 5.12]} width={3.3} height={.72} thai="พื้นที่จัดเก็บฟาง" english="STRAW STORAGE · ZONE A" />
    <Sign pos={[7.15, 2.3, 5.12]} width={1.1} height={.65} thai="ห้ามสูบบุหรี่" english="NO SMOKING" background="#a9322b" />
    <Sign pos={[9.18, 3, -4.35]} rotation={[0, Math.PI / 2, 0]} width={1.05} height={.65} thai="ระวังรถยก" english="FORKLIFT AREA" background="#99741f" />
    <group position={[7.15, 1.2, 5.08]}>
      <mesh><cylinderGeometry args={[.1, .1, .42, 20]} /><meshStandardMaterial color="#b52e26" roughness={.4} metalness={.15} /></mesh>
      <Box size={[.13, .045, .055]} pos={[0, .27, 0]} color="#333a37" />
      <Box size={[.08, .14, .006]} pos={[0, .03, .102]} color="#efeee4" />
    </group>
  </group>
}
