import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomTextureSet } from '../proceduralTextures';
import { ROOM_BOUNDS, ROOM_DIMENSIONS } from '../roomConstants';

interface RoomArchitectureProps {
  textures: RoomTextureSet;
  fanRunning: boolean;
  balconyDoorOpen?: boolean;
  hallwayDoorOpen?: boolean;
}

function WoodDoor({
  position,
  rotationY = 0,
  width = 0.84,
  height = 2.1,
  latchOnRight = true,
  woodTexture,
  isOpen = false,
  hingeSide = 'left',
  openAngle = -1.35,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
  latchOnRight?: boolean;
  woodTexture: THREE.Texture;
  isOpen?: boolean;
  hingeSide?: 'left' | 'right';
  openAngle?: number;
}) {
  const leafPivotRef = useRef<THREE.Group>(null);
  const openAngleRef = useRef(0);

  const frameThickness = 0.055;
  const innerW = width - frameThickness * 2;
  const slatCount = 4;
  const slatW = (innerW - 0.06) / slatCount;
  const hingeX = hingeSide === 'left' ? -width / 2 + frameThickness : width / 2 - frameThickness;
  const leafOffsetX = hingeSide === 'left' ? innerW / 2 : -innerW / 2;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const target = isOpen ? openAngle : 0;
    openAngleRef.current = THREE.MathUtils.damp(openAngleRef.current, target, 4.8, delta);
    if (leafPivotRef.current) {
      leafPivotRef.current.rotation.y = openAngleRef.current;
    }
  });

  return (
    <group name="WoodDoor" position={position} rotation={[0, rotationY, 0]}>
      {/* Outer Door Frame */}
      <mesh position={[-width / 2 + frameThickness / 2, height / 2, 0.015]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, 0.06]} />
        <meshStandardMaterial map={woodTexture} color="#6b4426" roughness={0.68} />
      </mesh>
      <mesh position={[width / 2 - frameThickness / 2, height / 2, 0.015]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, 0.06]} />
        <meshStandardMaterial map={woodTexture} color="#6b4426" roughness={0.68} />
      </mesh>
      <mesh position={[0, height - frameThickness / 2, 0.015]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, 0.06]} />
        <meshStandardMaterial map={woodTexture} color="#6b4426" roughness={0.68} />
      </mesh>

      {/* Hinged Door Leaf Group */}
      <group ref={leafPivotRef} position={[hingeX, 0, 0.01]}>
        <group position={[leafOffsetX, 0, 0]}>
          {/* Main Door Leaf */}
          <mesh position={[0, (height - frameThickness) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[innerW, height - frameThickness, 0.035]} />
            <meshStandardMaterial map={woodTexture} color="#764c2b" roughness={0.64} />
          </mesh>

          {/* Center Lock Rail & Top/Bottom Rails */}
          <mesh position={[0, height * 0.48, 0.018]} castShadow>
            <boxGeometry args={[innerW, 0.14, 0.016]} />
            <meshStandardMaterial map={woodTexture} color="#643e21" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.1, 0.018]} castShadow>
            <boxGeometry args={[innerW, 0.16, 0.016]} />
            <meshStandardMaterial map={woodTexture} color="#643e21" roughness={0.65} />
          </mesh>
          <mesh position={[0, height - 0.12, 0.018]} castShadow>
            <boxGeometry args={[innerW, 0.12, 0.016]} />
            <meshStandardMaterial map={woodTexture} color="#643e21" roughness={0.65} />
          </mesh>

          {/* Vertical Slats (4 upper + 4 lower recessed vertical panels) */}
          {Array.from({ length: slatCount }).map((_, idx) => {
            const sx = -innerW / 2 + 0.03 + slatW * (idx + 0.5);
            return (
              <group key={idx}>
                <mesh position={[sx, height * 0.72, 0.014]}>
                  <boxGeometry args={[slatW - 0.022, height * 0.36, 0.014]} />
                  <meshStandardMaterial map={woodTexture} color="#58361c" roughness={0.72} />
                </mesh>
                <mesh position={[sx, height * 0.28, 0.014]}>
                  <boxGeometry args={[slatW - 0.022, height * 0.28, 0.014]} />
                  <meshStandardMaterial map={woodTexture} color="#58361c" roughness={0.72} />
                </mesh>
              </group>
            );
          })}

          {/* Metal Latch & Handle */}
          <group position={[latchOnRight ? innerW * 0.36 : -innerW * 0.36, height * 0.49, 0.032]}>
            <mesh>
              <boxGeometry args={[0.14, 0.028, 0.018]} />
              <meshStandardMaterial color="#4a4e52" metalness={0.82} roughness={0.32} />
            </mesh>
            <mesh position={[latchOnRight ? 0.04 : -0.04, 0.11, 0.01]}>
              <boxGeometry args={[0.018, 0.1, 0.022]} />
              <meshStandardMaterial color="#55595e" metalness={0.85} roughness={0.28} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function LatticeVent({
  position,
  rotationY = 0,
  wallMap,
}: {
  position: [number, number, number];
  rotationY?: number;
  wallMap: THREE.Texture;
}) {
  return (
    <group name="LatticeVent" position={position} rotation={[0, rotationY, 0]}>
      {/* Dark recessed backing */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[0.38, 0.26]} />
        <meshStandardMaterial color="#0b120e" roughness={0.95} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0.125, 0.006]}>
        <boxGeometry args={[0.4, 0.022, 0.025]} />
        <meshStandardMaterial map={wallMap} roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.125, 0.006]}>
        <boxGeometry args={[0.4, 0.022, 0.025]} />
        <meshStandardMaterial map={wallMap} roughness={0.86} />
      </mesh>
      <mesh position={[-0.19, 0, 0.006]}>
        <boxGeometry args={[0.022, 0.26, 0.025]} />
        <meshStandardMaterial map={wallMap} roughness={0.86} />
      </mesh>
      <mesh position={[0.19, 0, 0.006]}>
        <boxGeometry args={[0.022, 0.26, 0.025]} />
        <meshStandardMaterial map={wallMap} roughness={0.86} />
      </mesh>
      {/* Decorative diamond & cross lattice bars */}
      {[-0.1, 0, 0.1].map((x, idx) => (
        <mesh key={`v-${idx}`} position={[x, 0, 0.005]}>
          <boxGeometry args={[0.016, 0.24, 0.016]} />
          <meshStandardMaterial map={wallMap} roughness={0.88} />
        </mesh>
      ))}
      {[-0.06, 0, 0.06].map((y, idx) => (
        <mesh key={`h-${idx}`} position={[0, y, 0.005]}>
          <boxGeometry args={[0.36, 0.016, 0.016]} />
          <meshStandardMaterial map={wallMap} roughness={0.88} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.008]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.12, 0.12, 0.014]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} />
      </mesh>
    </group>
  );
}

export function RoomArchitecture({
  textures,
  fanRunning,
  balconyDoorOpen = false,
  hallwayDoorOpen = false,
}: RoomArchitectureProps) {
  const fanRotorRef = useRef<THREE.Group>(null);
  const fanVelocityRef = useRef(fanRunning ? 3.2 : 0);
  const { width, depth, height, wallThickness, pillarSize, beamHeight, baseboardHeight } =
    ROOM_DIMENSIONS;

  // Exposed wall conduit curves running from switchboard up to top beam & across to left vent
  const wireGeometryMain = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.36, 1.29, -1.78),
      new THREE.Vector3(-0.36, 1.72, -1.78),
      new THREE.Vector3(-0.33, 2.08, -1.78),
      new THREE.Vector3(-0.35, 2.48, -1.78),
      new THREE.Vector3(-0.62, 2.51, -1.76),
      new THREE.Vector3(-0.88, 2.52, -1.61),
      new THREE.Vector3(-1.12, 2.44, -1.75),
      new THREE.Vector3(-1.42, 2.38, -1.78),
    ]);
    return new THREE.TubeGeometry(curve, 36, 0.007, 6, false);
  }, []);

  // Restored power/cable detail arching from left of switchboard down along wall behind/into PC casing
  const wireGeometrySecondary = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.5, 1.24, -1.772),
      new THREE.Vector3(-0.64, 1.46, -1.772),
      new THREE.Vector3(-0.69, 1.22, -1.772),
      new THREE.Vector3(-0.68, 0.94, -1.772),
      new THREE.Vector3(-0.65, 0.78, -1.74),
      new THREE.Vector3(-0.56, 0.65, -1.6),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.0068, 8, false);
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const targetSpeed = fanRunning ? 3.2 : 0;
    const damping = fanRunning ? 2.4 : 1.5;
    fanVelocityRef.current = THREE.MathUtils.damp(
      fanVelocityRef.current,
      targetSpeed,
      damping,
      delta,
    );
    if (fanRotorRef.current && fanVelocityRef.current > 0.001) {
      fanRotorRef.current.rotation.y += fanVelocityRef.current * delta;
    }
  });

  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group name="RoomArchitecture">
      {/* Matte Dark Charcoal Concrete Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          map={textures.floorAlbedo}
          bumpMap={textures.floorBump}
          bumpScale={0.012}
          roughness={0.92}
          metalness={0.02}
          envMapIntensity={0.14}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#d8e0dc" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Front Wall (-Z) */}
      <mesh position={[0, height / 2, -halfD - wallThickness / 2]} receiveShadow>
        <boxGeometry args={[width + wallThickness * 2, height, wallThickness]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>

      {/* Back Wall (+Z) segmented with genuine Balcony Doorway opening behind [-1.36, 0, halfD] */}
      <mesh position={[-1.905, height / 2, halfD + wallThickness / 2]} receiveShadow>
        <boxGeometry args={[0.27, height, wallThickness]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>
      <mesh position={[-1.36, 2.45, halfD + wallThickness / 2]} receiveShadow>
        <boxGeometry args={[0.82, 0.8, wallThickness]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>
      <mesh position={[0.545, height / 2, halfD + wallThickness / 2]} receiveShadow>
        <boxGeometry args={[2.99, height, wallThickness]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>

      {/* Twilight Balcony Glimpse visible behind Back-Left Door when opened */}
      <group name="BalconyDoorVestibule" position={[-1.36, 0, halfD + wallThickness]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0.62]}>
          <planeGeometry args={[1.4, 1.24]} />
          <meshStandardMaterial color="#1f2421" roughness={0.92} />
        </mesh>
        {/* Solid Left Balcony Wall (-X) */}
        <mesh position={[-0.54, 1.4, 0.62]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.24, 2.8]} />
          <meshStandardMaterial map={textures.wallAlbedo} roughness={0.88} color="#3ea165" />
        </mesh>
        {/* Parapet & Twilight Backdrop */}
        <mesh position={[0.1, 0.36, 1.22]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.5, 0.72]} />
          <meshStandardMaterial color="#3ea165" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 1.45, 1.55]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.2, 1.8]} />
          <meshBasicMaterial color="#4b2c5e" />
        </mesh>
        {/* Balcony Grille Bars Preview */}
        {[-0.4, -0.1, 0.2, 0.5].map((gx, i) => (
          <mesh key={i} position={[gx, 1.45, 1.22]}>
            <boxGeometry args={[0.018, 1.44, 0.018]} />
            <meshStandardMaterial color="#57351e" roughness={0.75} />
          </mesh>
        ))}
        <pointLight position={[0, 2.2, 0.62]} color="#e9d5ff" intensity={1.8} distance={3.5} />
      </group>

      {/* Left Wall (-X) */}
      <mesh position={[-halfW - wallThickness / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>

      {/* Right Wall (+X) */}
      <mesh position={[halfW + wallThickness / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>

      {/* Black Skirting / Baseboards along walls */}
      {/* Front baseboard (central bay) */}
      <mesh position={[0.45, baseboardHeight / 2, -halfD + 0.008]} receiveShadow>
        <boxGeometry args={[2.5, baseboardHeight, 0.016]} />
        <meshStandardMaterial color="#121614" roughness={0.55} />
      </mesh>
      {/* Left wall full baseboard */}
      <mesh position={[-halfW + 0.008, baseboardHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.016, baseboardHeight, depth]} />
        <meshStandardMaterial color="#121614" roughness={0.55} />
      </mesh>
      {/* Right wall baseboard */}
      <mesh position={[halfW - 0.008, baseboardHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.016, baseboardHeight, depth]} />
        <meshStandardMaterial color="#121614" roughness={0.55} />
      </mesh>
      {/* Back wall baseboard */}
      <mesh position={[0.45, baseboardHeight / 2, halfD - 0.008]} receiveShadow>
        <boxGeometry args={[2.5, baseboardHeight, 0.016]} />
        <meshStandardMaterial color="#121614" roughness={0.55} />
      </mesh>

      {/* Structural Concrete Pillars */}
      {/* Front-Left Bay Pillar (separating Front Door alcove from desk bay) */}
      <mesh
        position={[-0.89, height / 2, -halfD + pillarSize / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pillarSize, height, pillarSize]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.006}
          roughness={0.85}
        />
      </mesh>
      {/* Front-Right Corner Pillar */}
      <mesh
        position={[halfW - pillarSize / 2, height / 2, -halfD + pillarSize / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pillarSize, height, pillarSize]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.006}
          roughness={0.85}
        />
      </mesh>
      {/* Back-Right Corner Pillar */}
      <mesh
        position={[halfW - pillarSize / 2, height / 2, halfD - pillarSize / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pillarSize, height, pillarSize]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.006}
          roughness={0.85}
        />
      </mesh>

      {/* Top Perimeter Concrete Ceiling Beams */}
      {/* Front Beam */}
      <mesh
        position={[0.45, height - beamHeight / 2, -halfD + pillarSize / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.9, beamHeight, pillarSize]} />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
      </mesh>
      {/* Right Beam */}
      <mesh
        position={[halfW - pillarSize / 2, height - beamHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pillarSize, beamHeight, depth]} />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
      </mesh>
      {/* Back Beam */}
      <mesh
        position={[0, height - beamHeight / 2, halfD - pillarSize / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, beamHeight, pillarSize]} />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
      </mesh>
      {/* Front-Left Alcove Beam above shelf end */}
      <mesh
        position={[-1.45, height - beamHeight / 2, -halfD + 0.22]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.92, beamHeight, 0.44]} />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
      </mesh>

      {/* Left Wall Upper Concrete Loft Shelf (Tare / Chajja) */}
      <mesh position={[-halfW + 0.28, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.08, depth]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.006}
          roughness={0.86}
        />
      </mesh>

      {/* Front-Left Wooden Door (#2 — Entrance to Main Hallway) */}
      <WoodDoor
        position={[-1.44, 0, -halfD + 0.01]}
        rotationY={0}
        width={0.86}
        height={2.08}
        latchOnRight={true}
        woodTexture={textures.teakWood}
        isOpen={hallwayDoorOpen}
        hingeSide="left"
        openAngle={-1.32}
      />

      {/* Back-Left Wooden Door (#1 — Existing Balcony Door, hinged on Left Wall side) */}
      <WoodDoor
        position={[-1.36, 0, halfD - 0.01]}
        rotationY={Math.PI}
        width={0.82}
        height={2.08}
        latchOnRight={false}
        woodTexture={textures.teakWood}
        isOpen={balconyDoorOpen}
        hingeSide="right"
        openAngle={1.32}
      />

      {/* Decorative Lattice Vents above both doors */}
      <LatticeVent
        position={[-1.44, 2.38, -halfD + 0.02]}
        rotationY={0}
        wallMap={textures.wallAlbedo}
      />
      <LatticeVent
        position={[-1.36, 2.36, halfD - 0.23]}
        rotationY={Math.PI}
        wallMap={textures.wallAlbedo}
      />

      {/* Right Wall Frosted Glass Vent & Red Indicator */}
      <mesh position={[halfW - 0.01, 2.34, 0.02]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.38, 0.22]} />
        <meshStandardMaterial color="#d4dfdc" roughness={0.4} metalness={0.05} />
      </mesh>
      <group position={[halfW - 0.02, 2.24, 0.44]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.015, 16]} />
          <meshStandardMaterial color="#ced4d2" roughness={0.5} />
        </mesh>
        <mesh position={[-0.025, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.026, 0.045, 16]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.1} />
        </mesh>
      </group>

      {/* Back Wall Frosted White Panel + Small Black Calligraphy Plaque + Sensor */}
      <mesh position={[0.06, 2.36, halfD - 0.23]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.42, 0.24]} />
        <meshStandardMaterial color="#dce4e1" roughness={0.45} />
      </mesh>
      <mesh position={[0.44, 2.34, halfD - 0.23]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.14, 0.18, 0.012]} />
        <meshStandardMaterial color="#181a1b" roughness={0.4} />
      </mesh>
      <mesh position={[0.64, 2.24, halfD - 0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 0.018, 8]} />
        <meshStandardMaterial color="#94a39c" roughness={0.5} />
      </mesh>

      {/* Front Wall Electrical Switchboard & Exposed Conduit Wires */}
      <group name="Switchboard" position={[-0.36, 1.24, -halfD + 0.015]}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.1, 0.025]} />
          <meshStandardMaterial color="#cfd5d8" roughness={0.35} metalness={0.25} />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[-0.14 + i * 0.042, 0, 0.016]}>
            <boxGeometry args={[0.024, 0.048, 0.01]} />
            <meshStandardMaterial color={i === 6 ? '#26292c' : '#e5e7eb'} roughness={0.4} />
          </mesh>
        ))}
      </group>
      <mesh geometry={wireGeometryMain}>
        <meshStandardMaterial color="#a16207" roughness={0.7} />
      </mesh>
      <mesh geometry={wireGeometrySecondary}>
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>

      {/* Central Ceiling Fan (stationary canopy, downrod, & motor cap; rotating blade rotor only) */}
      <group name="CeilingFan" position={[0, height - 0.02, 0.05]}>
        {/* Stationary Canopy */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.075, 0.055, 0.05, 16]} />
          <meshStandardMaterial color="#4b3a30" roughness={0.45} metalness={0.3} />
        </mesh>
        {/* Stationary Downrod */}
        <mesh position={[0, -0.17, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.28, 12]} />
          <meshStandardMaterial color="#4b3a30" roughness={0.45} metalness={0.5} />
        </mesh>
        {/* Stationary Upper Motor Trim Cap */}
        <mesh position={[0, -0.285, 0]}>
          <cylinderGeometry args={[0.082, 0.095, 0.024, 24]} />
          <meshStandardMaterial color="#3f3128" roughness={0.45} metalness={0.4} />
        </mesh>
        {/* Rotating Rotor Hub & 3 Blades */}
        <group ref={fanRotorRef} position={[0, -0.315, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.055, 24]} />
            <meshStandardMaterial color="#523f34" roughness={0.4} metalness={0.4} />
          </mesh>
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, idx) => (
            <group key={idx} rotation={[0, angle, 0]}>
              <mesh position={[0.31, 0, 0]} rotation={[0.1, 0, 0]} castShadow>
                <boxGeometry args={[0.52, 0.012, 0.115]} />
                <meshStandardMaterial color="#5c473b" roughness={0.42} metalness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
