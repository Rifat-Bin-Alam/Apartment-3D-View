import {
  Component,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createHallwayTextures, HallwayTextureSet } from './hallwayTextures';
import {
  HALLWAY_BOUNDS,
  HALLWAY_COLLIDERS,
  HALLWAY_DIMENSIONS,
  HALLWAY_PRESETS,
  HallwayPresetId,
} from './hallwayConstants';
import { BalconyEntrance } from './components/BalconyEntrance';

interface MainHallwaySceneProps {
  activePreset: HallwayPresetId;
  presetTrigger: number;
  roomLightOn: boolean;
  fanRunning: boolean;
  enteredFromRoom?: boolean;
  hallwayGroupRef: React.RefObject<THREE.Group | null>;
  onReturnToBedroom: () => void;
  onTransitionChange: (visible: boolean, label?: string) => void;
  onPreloadBedroom: () => void;
}

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const rendererName = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererName);
  } catch {
    return true;
  }
}

class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#0f1c16] p-8 text-center text-zinc-200">
          <div className="max-w-md space-y-3">
            <h2 className="text-xl font-semibold">3D Main Hallway Unavailable</h2>
            <p className="text-sm text-zinc-400">
              WebGL could not initialize on this device. Please refresh to explore the hallway.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

function clampCameraInsideHallway(pos: THREE.Vector3): void {
  const wallMargin = 0.24;
  const inBackLeftCorridor =
    pos.x >= 1.24 && pos.x <= 1.98 && pos.z > HALLWAY_BOUNDS.maxZ - wallMargin && pos.z <= 3.72;
  const inBackRightCorridor =
    pos.x >= HALLWAY_BOUNDS.minX + wallMargin &&
    pos.x <= -1.18 &&
    pos.z > HALLWAY_BOUNDS.maxZ - wallMargin &&
    pos.z <= 3.72;
  const inFrontNeCorridor =
    pos.x >= 1.04 &&
    pos.x <= 1.72 &&
    pos.z < HALLWAY_BOUNDS.minZ + wallMargin &&
    pos.z >= -4.2;

  if (inBackLeftCorridor) {
    pos.x = THREE.MathUtils.clamp(pos.x, 1.34, 1.88);
    pos.y = THREE.MathUtils.clamp(pos.y, 0.42, 2.18);
    pos.z = THREE.MathUtils.clamp(pos.z, HALLWAY_BOUNDS.maxZ - wallMargin, 3.45);
  } else if (inBackRightCorridor) {
    pos.x = THREE.MathUtils.clamp(pos.x, HALLWAY_BOUNDS.minX + wallMargin, -1.28);
    pos.y = THREE.MathUtils.clamp(pos.y, 0.42, 2.18);
    pos.z = THREE.MathUtils.clamp(pos.z, HALLWAY_BOUNDS.maxZ - wallMargin, 3.45);
  } else if (inFrontNeCorridor) {
    pos.x = THREE.MathUtils.clamp(pos.x, 1.14, 1.62);
    pos.y = THREE.MathUtils.clamp(pos.y, 0.42, 2.18);
    pos.z = THREE.MathUtils.clamp(pos.z, -3.92, HALLWAY_BOUNDS.minZ + wallMargin);
  } else {
    pos.x = THREE.MathUtils.clamp(
      pos.x,
      HALLWAY_BOUNDS.minX + wallMargin,
      HALLWAY_BOUNDS.maxX - wallMargin,
    );
    pos.y = THREE.MathUtils.clamp(pos.y, 0.42, HALLWAY_BOUNDS.maxY - 0.32);
    pos.z = THREE.MathUtils.clamp(
      pos.z,
      HALLWAY_BOUNDS.minZ + wallMargin,
      HALLWAY_BOUNDS.maxZ - wallMargin,
    );
  }

  const pad = 0.12;
  for (let i = 0; i < HALLWAY_COLLIDERS.length; i++) {
    const box = HALLWAY_COLLIDERS[i];
    const minX = box.minX - pad;
    const maxX = box.maxX + pad;
    const minY = box.minY - pad;
    const maxY = box.maxY + pad;
    const minZ = box.minZ - pad;
    const maxZ = box.maxZ + pad;

    if (
      pos.x > minX &&
      pos.x < maxX &&
      pos.y > minY &&
      pos.y < maxY &&
      pos.z > minZ &&
      pos.z < maxZ
    ) {
      const dxMin = Math.abs(pos.x - minX);
      const dxMax = Math.abs(maxX - pos.x);
      const dyMax = Math.abs(maxY - pos.y);
      const dzMin = Math.abs(pos.z - minZ);
      const dzMax = Math.abs(maxZ - pos.z);

      const minPen = Math.min(dxMin, dxMax, dyMax, dzMin, dzMax);
      if (minPen === dxMin) pos.x = minX;
      else if (minPen === dxMax) pos.x = maxX;
      else if (minPen === dyMax) pos.y = maxY;
      else if (minPen === dzMin) pos.z = minZ;
      else pos.z = maxZ;
    }
  }
}

function HallwayFan({
  position,
  fanRunning,
}: {
  position: [number, number, number];
  fanRunning: boolean;
}) {
  const rotorRef = useRef<THREE.Group>(null);
  const velRef = useRef(fanRunning ? 3.1 : 0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const target = fanRunning ? 3.1 : 0;
    velRef.current = THREE.MathUtils.damp(velRef.current, target, fanRunning ? 2.4 : 1.5, delta);
    if (rotorRef.current && velRef.current > 0.001) {
      rotorRef.current.rotation.y += velRef.current * delta;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.065, 0.05, 0.05, 14]} />
        <meshStandardMaterial color="#b4afa4" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.24, 10]} />
        <meshStandardMaterial color="#9e998f" roughness={0.5} metalness={0.4} />
      </mesh>
      <group ref={rotorRef} position={[0, -0.28, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 20]} />
          <meshStandardMaterial color="#9c9385" roughness={0.45} metalness={0.35} />
        </mesh>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, idx) => (
          <group key={idx} rotation={[0, ang, 0]}>
            <mesh position={[0.29, 0, 0]} rotation={[0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.48, 0.012, 0.11]} />
              <meshStandardMaterial color="#c4bba9" roughness={0.45} metalness={0.25} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function PanelWoodDoor({
  position,
  rotationY = 0,
  width = 0.84,
  height = 2.04,
  color = '#6e3f20',
  frameColor = '#4a2915',
  teakTex,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
  color?: string;
  frameColor?: string;
  teakTex: THREE.CanvasTexture;
}) {
  const leafW = width - 0.08;
  const leafH = height - 0.04;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Door Frame */}
      <mesh position={[-width / 2 + 0.025, height / 2, 0.01]} castShadow>
        <boxGeometry args={[0.05, height, 0.055]} />
        <meshStandardMaterial color={frameColor} roughness={0.68} />
      </mesh>
      <mesh position={[width / 2 - 0.025, height / 2, 0.01]} castShadow>
        <boxGeometry args={[0.05, height, 0.055]} />
        <meshStandardMaterial color={frameColor} roughness={0.68} />
      </mesh>
      <mesh position={[0, height - 0.025, 0.01]} castShadow>
        <boxGeometry args={[width, 0.05, 0.055]} />
        <meshStandardMaterial color={frameColor} roughness={0.68} />
      </mesh>
      {/* Main Wooden Leaf */}
      <mesh position={[0, leafH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[leafW, leafH, 0.036]} />
        <meshStandardMaterial map={teakTex} color={color} roughness={0.62} />
      </mesh>
      {/* Horizontal lock rail trim */}
      <mesh position={[0, leafH * 0.48, 0.02]}>
        <boxGeometry args={[leafW - 0.04, 0.08, 0.01]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} />
      </mesh>
      {/* Vertical panel slats (top & bottom sections) */}
      {[-0.18, 0, 0.18].map((sx, idx) => (
        <mesh key={idx} position={[sx * (leafW / 0.76), leafH * 0.5, 0.02]}>
          <boxGeometry args={[0.022, leafH * 0.84, 0.008]} />
          <meshStandardMaterial color={frameColor} roughness={0.62} />
        </mesh>
      ))}
      {/* Brushed Metallic Lever Handle & Lock Plate */}
      <mesh position={[leafW * 0.36, 0.96, 0.024]}>
        <boxGeometry args={[0.032, 0.12, 0.01]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[leafW * 0.32, 0.98, 0.044]}>
        <boxGeometry args={[0.1, 0.02, 0.022]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

function HallwayGrillPanel({
  position,
  rotationY = 0,
  spanWidth,
  height = 2.08,
  bays = 2,
  rungCount = 8,
}: {
  position: [number, number, number];
  rotationY?: number;
  spanWidth: number;
  height?: number;
  bays?: number;
  rungCount?: number;
}) {
  const stepX = spanWidth / bays;
  const rungStepY = height / (rungCount + 1);

  return (
    <group name="HallwayBalconyStyleGrill" position={position} rotation={[0, rotationY, 0]}>
      {/* Top & Bottom steel frame bars */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[spanWidth, 0.022, 0.022]} />
        <meshStandardMaterial color="#59351e" roughness={0.72} metalness={0.35} />
      </mesh>
      <mesh position={[0, -height / 2, 0]} castShadow>
        <boxGeometry args={[spanWidth, 0.022, 0.022]} />
        <meshStandardMaterial color="#59351e" roughness={0.72} metalness={0.35} />
      </mesh>
      {/* Vertical iron bars */}
      {Array.from({ length: bays + 1 }).map((_, idx) => {
        const vx = -spanWidth / 2 + idx * stepX;
        return (
          <mesh key={`v-${idx}`} position={[vx, 0, 0]} castShadow>
            <boxGeometry args={[0.016, height, 0.016]} />
            <meshStandardMaterial color="#683e23" roughness={0.75} metalness={0.32} />
          </mesh>
        );
      })}
      {/* Alternating half-ladder horizontal rungs matching balcony SecurityGrilleSpan */}
      {Array.from({ length: bays }).map((_, bayIdx) => {
        if (bayIdx % 2 === 1) return null;
        const bx = -spanWidth / 2 + (bayIdx + 0.5) * stepX;
        return Array.from({ length: rungCount }).map((__, rIdx) => {
          const ry = -height / 2 + (rIdx + 1) * rungStepY;
          return (
            <mesh key={`r-${bayIdx}-${rIdx}`} position={[bx, ry, 0]}>
              <boxGeometry args={[stepX, 0.012, 0.012]} />
              <meshStandardMaterial color="#6e4428" roughness={0.76} metalness={0.3} />
            </mesh>
          );
        });
      })}
    </group>
  );
}

function TiedDoorCurtains({
  position,
  rotationY = 0,
  width = 0.88,
  height = 2.02,
  curtainTex,
  doorTex,
  doorColor = '#5e341a',
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
  curtainTex: THREE.CanvasTexture;
  doorTex?: THREE.CanvasTexture;
  doorColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Wooden door behind curtains when provided (under left & right ventilation grilles), otherwise dark opening */}
      {doorTex ? (
        <PanelWoodDoor
          position={[0, 0, -0.025]}
          width={width - 0.04}
          height={height}
          color={doorColor}
          teakTex={doorTex}
        />
      ) : (
        <mesh position={[0, height / 2, -0.02]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color="#070a09" roughness={0.96} />
        </mesh>
      )}
      {/* Metal rod */}
      <mesh position={[0, height + 0.04, 0.035]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, width + 0.14, 10]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Left & Right gathered floral curtain panels */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width * 0.42), height * 0.52, 0.04]} castShadow>
          <cylinderGeometry args={[0.065, 0.052, height * 0.94, 12]} />
          <meshStandardMaterial map={curtainTex} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function HallwayLatticeVent({
  position,
  rotationY = 0,
  wallMap,
}: {
  position: [number, number, number];
  rotationY?: number;
  wallMap: THREE.Texture;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.36, 0.24]} />
        <meshStandardMaterial color="#0b120e" roughness={0.95} />
      </mesh>
      {[-0.1, 0, 0.1].map((x, idx) => (
        <mesh key={`v-${idx}`} position={[x, 0, 0.005]}>
          <boxGeometry args={[0.015, 0.22, 0.014]} />
          <meshStandardMaterial map={wallMap} roughness={0.86} />
        </mesh>
      ))}
      {[-0.06, 0, 0.06].map((y, idx) => (
        <mesh key={`h-${idx}`} position={[0, y, 0.005]}>
          <boxGeometry args={[0.34, 0.015, 0.014]} />
          <meshStandardMaterial map={wallMap} roughness={0.86} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.008]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.1, 0.1, 0.012]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} />
      </mesh>
    </group>
  );
}

function DiningChair({
  position,
  rotationY = 0,
  coverTex,
}: {
  position: [number, number, number];
  rotationY?: number;
  coverTex: THREE.CanvasTexture;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Wooden legs */}
      {[
        [-0.17, 0.22, -0.17],
        [0.17, 0.22, -0.17],
        [-0.17, 0.22, 0.17],
        [0.17, 0.22, 0.17],
      ].map(([lx, ly, lz], idx) => (
        <mesh key={idx} position={[lx, ly, lz]} castShadow>
          <boxGeometry args={[0.04, 0.44, 0.04]} />
          <meshStandardMaterial color="#593a23" roughness={0.75} />
        </mesh>
      ))}
      {/* Floral slipcover seat */}
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.06, 0.42]} />
        <meshStandardMaterial map={coverTex} roughness={0.84} />
      </mesh>
      {/* Tall floral slipcover backrest */}
      <mesh position={[0, 0.74, 0.19]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.54, 0.06]} />
        <meshStandardMaterial map={coverTex} roughness={0.84} />
      </mesh>
    </group>
  );
}

function MainHallwayWorld({
  hallwayGroupRef,
  textures,
  roomLightOn,
  fanRunning,
  isTransitioning,
  onReturnToBedroom,
  onPreloadBedroom,
}: {
  hallwayGroupRef: React.RefObject<THREE.Group | null>;
  textures: HallwayTextureSet;
  roomLightOn: boolean;
  fanRunning: boolean;
  isTransitioning: boolean;
  onReturnToBedroom: () => void;
  onPreloadBedroom: () => void;
}) {
  const { width, depth, height, wallThickness, baseboardHeight } = HALLWAY_DIMENSIONS;
  const halfW = width / 2; // 2.40
  const halfD = depth / 2; // 2.20

  return (
    <group ref={hallwayGroupRef} name="MainHallwayEnvironment">
      {/* Two-Tone Concrete Floor matching photos: Red-Brown Left Bay (-X) & Dark Slate Right Bay (+X) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.25, 0, 0]} receiveShadow>
        <planeGeometry args={[2.3, depth]} />
        <meshStandardMaterial
          map={textures.floorRedAlbedo}
          bumpMap={textures.floorBump}
          bumpScale={0.012}
          roughness={0.9}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.15, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, depth]} />
        <meshStandardMaterial
          map={textures.floorDarkAlbedo}
          bumpMap={textures.floorBump}
          bumpScale={0.012}
          roughness={0.9}
        />
      </mesh>

      {/* Ceiling & Central Longitudinal Beam + 2 Ceiling Fans */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#d4deda" roughness={0.92} />
      </mesh>
      <mesh position={[-0.1, height - 0.21, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.42, depth]} />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
      </mesh>
      {/* Doorbell chime mounted on beam side */}
      <mesh position={[0.02, 2.66, 0.65]}>
        <boxGeometry args={[0.04, 0.1, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>
      <HallwayFan position={[-1.24, height - 0.02, 0.15]} fanRunning={fanRunning} />
      <HallwayFan position={[1.15, height - 0.02, -0.05]} fanRunning={fanRunning} />

      {/* ================================================================= */}
      {/* 1. FRONT WALL (-Z = -2.20): NW Passage, Walton Fridge, Dining, NE Passage */}
      {/* ================================================================= */}
      {/* NW open corridor header (X: -2.40 .. -1.68, Y: 2.10 .. 2.88) & rod */}
      <mesh position={[-2.04, 2.49, -halfD - wallThickness / 2]} receiveShadow>
        <boxGeometry args={[0.72, 0.78, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      <mesh position={[-2.04, 2.08, -halfD + 0.03]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.011, 0.011, 0.8, 10]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Green wall behind fridge & dining table (X: -1.68 .. +0.96) */}
      <mesh position={[-0.36, height / 2, -halfD - wallThickness / 2]} receiveShadow>
        <boxGeometry args={[2.64, height, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      {/* NE open corridor header (X: +0.96 .. +1.80, Y: 2.10 .. 2.88) */}
      <mesh position={[1.38, 2.49, -halfD - wallThickness / 2]} receiveShadow>
        <boxGeometry args={[0.84, 0.78, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      {/* Front-Right corner pier (X: +1.80 .. +2.54) */}
      <mesh position={[2.17, height / 2, -halfD - wallThickness / 2]} receiveShadow>
        <boxGeometry args={[0.74, height, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>

      {/* NW Doorway Behind Fridge (Blue arrow in screenshot: door-only recess + balcony-style half grill) */}
      <group name="FrontNwDoorRecess">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.04, 0, -2.28]} receiveShadow>
          <planeGeometry args={[0.72, 0.22]} />
          <meshStandardMaterial map={textures.floorRedAlbedo} roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-2.04, 2.1, -2.28]}>
          <planeGeometry args={[0.72, 0.22]} />
          <meshStandardMaterial color="#d4deda" roughness={0.92} />
        </mesh>
        <mesh position={[-1.61, 1.05, -2.35]} receiveShadow>
          <boxGeometry args={[wallThickness, 2.1, 0.18]} />
          <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
        </mesh>
        <mesh position={[-2.04, 1.05, -2.41]} receiveShadow>
          <boxGeometry args={[0.98, 2.18, 0.08]} />
          <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
        </mesh>
        <PanelWoodDoor
          position={[-2.04, 0, -2.34]}
          rotationY={0}
          width={0.72}
          height={2.04}
          color="#5c3319"
          teakTex={textures.teakWood}
        />
      </group>

      {/* NE Front-Right Real Hallway Continuation (-Z: -2.20 .. -4.20, X: +0.96 .. +1.80) */}
      <group name="FrontNeHallwayContinuation">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.38, 0, -3.2]} receiveShadow>
          <planeGeometry args={[0.84, 2.04]} />
          <meshStandardMaterial map={textures.floorDarkAlbedo} bumpMap={textures.floorBump} bumpScale={0.012} roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[1.38, 2.38, -3.2]}>
          <planeGeometry args={[0.84, 2.04]} />
          <meshStandardMaterial color="#d4deda" roughness={0.92} />
        </mesh>
        {/* West inner wall (X = 0.89), East inner wall (X = 1.87) */}
        <mesh position={[0.89, height / 2, -3.27]} receiveShadow>
          <boxGeometry args={[wallThickness, height, 2.0]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[1.87, height / 2, -3.27]} receiveShadow>
          <boxGeometry args={[wallThickness, height, 2.0]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        {/* Far-North end wall (Z = -4.27) with blue-marked window opening (X: 0.98..1.78, Y: 0.96..2.02) */}
        <mesh position={[1.38, 0.48, -4.27]} receiveShadow>
          <boxGeometry args={[1.12, 0.96, wallThickness]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[1.38, 0.96, -4.25]} receiveShadow>
          <boxGeometry args={[0.84, 0.03, 0.17]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.88} />
        </mesh>
        <mesh position={[1.38, 2.45, -4.27]} receiveShadow>
          <boxGeometry args={[1.12, 0.86, wallThickness]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[0.9, 1.49, -4.27]} receiveShadow>
          <boxGeometry args={[0.16, 1.06, wallThickness]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[1.86, 1.49, -4.27]} receiveShadow>
          <boxGeometry args={[0.16, 1.06, wallThickness]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[1.38, baseboardHeight / 2, -4.192]} receiveShadow>
          <boxGeometry args={[0.84, baseboardHeight, 0.016]} />
          <meshStandardMaterial color="#361c14" roughness={0.6} />
        </mesh>
        {/* Blue-marked sized balcony-style grill inside the far exterior window opening */}
        <HallwayGrillPanel
          position={[1.38, 1.49, -4.24]}
          spanWidth={0.8}
          height={1.06}
          bays={4}
          rungCount={5}
        />
        {/* Outside home twilight view visible through the hallway window grill */}
        <mesh position={[1.38, 1.48, -5.35]}>
          <planeGeometry args={[4.8, 3.2]} />
          <meshBasicMaterial map={textures.outsideHomeView} />
        </mesh>
        <mesh position={[0.968, baseboardHeight / 2, -3.2]} receiveShadow>
          <boxGeometry args={[0.016, baseboardHeight, 2.0]} />
          <meshStandardMaterial color="#361c14" roughness={0.6} />
        </mesh>
        <mesh position={[1.792, baseboardHeight / 2, -3.2]} receiveShadow>
          <boxGeometry args={[0.016, baseboardHeight, 2.0]} />
          <meshStandardMaterial color="#361c14" roughness={0.6} />
        </mesh>
        {/* Interior door along East inner wall visible from front photo */}
        <PanelWoodDoor
          position={[1.79, 0, -3.22]}
          rotationY={-Math.PI / 2}
          width={0.78}
          height={2.02}
          color="#5c3319"
          teakTex={textures.teakWood}
        />
        <pointLight
          position={[1.38, 2.12, -3.18]}
          color="#f8fcff"
          intensity={roomLightOn ? 2.6 : 0.18}
          distance={5}
          decay={1.55}
        />
      </group>

      {/* Walton Maroon/Wine-Red Double-Door Fridge (Front-Left Bay) */}
      <group name="WaltonFridge" position={[-1.52, 0, -1.86]}>
        <mesh position={[0, 0.82, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.62, 1.64, 0.62]} />
          <meshStandardMaterial color="#3b3e42" roughness={0.55} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.82, 0.295]} castShadow>
          <planeGeometry args={[0.6, 1.6]} />
          <meshStandardMaterial map={textures.fridgeDoor} roughness={0.22} metalness={0.18} />
        </mesh>
        {/* Voltage stabilizer box on wall above fridge */}
        <mesh position={[0, 1.88, -0.3]} castShadow>
          <boxGeometry args={[0.18, 0.22, 0.12]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.88, -0.23]}>
          <boxGeometry args={[0.07, 0.09, 0.02]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.3} />
        </mesh>
      </group>

      {/* Hanging Vine Plant & Croton Plant beside Fridge */}
      <group position={[-1.08, 2.02, -2.14]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.06, 0.1, 10]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.18, 0.02]}>
          <planeGeometry args={[0.38, 0.56]} />
          <meshStandardMaterial
            map={textures.leafSpray}
            transparent
            alphaTest={0.25}
            side={THREE.DoubleSide}
            roughness={0.78}
          />
        </mesh>
      </group>
      <group position={[-0.84, 0, -1.9]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.24, 12]} />
          <meshStandardMaterial color="#3f2b20" roughness={0.85} />
        </mesh>
        {[0, Math.PI / 2].map((r, i) => (
          <mesh key={i} position={[0, 0.45, 0]} rotation={[0, r, 0]}>
            <planeGeometry args={[0.42, 0.58]} />
            <meshStandardMaterial
              map={textures.crotonLeaf}
              transparent
              alphaTest={0.25}
              side={THREE.DoubleSide}
              roughness={0.75}
            />
          </mesh>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 2. FLORAL DINING TABLE & CHAIRS (Center-Right Bay)                */}
      {/* ================================================================= */}
      <group name="HallwayDiningSet" position={[0.6, 0, -0.78]}>
        {/* Wooden legs & floral tablecloth top (reduced horizontal width) */}
        {[
          [-0.54, 0.36, -0.41],
          [0.54, 0.36, -0.41],
          [-0.54, 0.36, 0.41],
          [0.54, 0.36, 0.41],
        ].map(([lx, ly, lz], idx) => (
          <mesh key={idx} position={[lx, ly, lz]} castShadow>
            <boxGeometry args={[0.055, 0.72, 0.055]} />
            <meshStandardMaterial color="#593a23" roughness={0.75} />
          </mesh>
        ))}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.24, 0.05, 0.98]} />
          <meshStandardMaterial map={textures.tableClothFloral} roughness={0.82} />
        </mesh>
        {/* Draped tablecloth skirt */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[1.26, 0.22, 1.0]} />
          <meshStandardMaterial map={textures.tableClothFloral} roughness={0.85} />
        </mesh>

        {/* Pots, pans, jars, water bottle & pitcher matching Front & Back photos */}
        <mesh position={[0.2, 0.85, -0.2]} castShadow>
          <cylinderGeometry args={[0.13, 0.12, 0.14, 18]} />
          <meshStandardMaterial color="#1f2937" roughness={0.35} metalness={0.55} />
        </mesh>
        <mesh position={[-0.18, 0.84, -0.16]} castShadow>
          <cylinderGeometry args={[0.11, 0.1, 0.12, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[-0.3, 0.88, 0.12]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.18, 12]} />
          <meshStandardMaterial color="#e5e7eb" transparent opacity={0.65} roughness={0.2} />
        </mesh>
        <mesh position={[0.04, 0.87, 0.16]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.16, 12]} />
          <meshStandardMaterial color="#eab308" roughness={0.45} />
        </mesh>
        <mesh position={[0.36, 0.86, 0.1]} castShadow>
          <boxGeometry args={[0.13, 0.15, 0.13]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.45} />
        </mesh>

        {/* 5 Floral-Covered Dining Chairs (3 facing Back +Z, 1 East, 1 North) */}
        <DiningChair position={[-0.39, 0, 0.58]} rotationY={0} coverTex={textures.chairRoseCover} />
        <DiningChair position={[0.0, 0, 0.58]} rotationY={0} coverTex={textures.chairRoseCover} />
        <DiningChair position={[0.39, 0, 0.58]} rotationY={0} coverTex={textures.chairRoseCover} />
        <DiningChair position={[0.76, 0, -0.04]} rotationY={Math.PI / 2} coverTex={textures.chairRoseCover} />
        <DiningChair position={[0.1, 0, -0.58]} rotationY={Math.PI} coverTex={textures.chairRoseCover} />
      </group>

      {/* ================================================================= */}
      {/* 3. RIGHT WALL (+X = +2.40): Continuous Wall (Yellow-X Removed)    */}
      {/* ================================================================= */}
      <mesh position={[halfW + wallThickness / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth + wallThickness * 2]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>

      {/* North-East curtained doorway ('right hallway' photo) with wooden door under ventilation grille */}
      <TiedDoorCurtains
        position={[halfW - 0.02, 0, -1.28]}
        rotationY={-Math.PI / 2}
        width={0.9}
        height={2.02}
        curtainTex={textures.curtainFloral}
        doorTex={textures.teakWood}
        doorColor="#4d2b18"
      />
      <HallwayLatticeVent position={[halfW - 0.02, 2.38, -1.28]} rotationY={-Math.PI / 2} wallMap={textures.wallAlbedo} />

      {/* Center-East wall indicator & switchboard */}
      <mesh position={[halfW - 0.02, 1.56, -0.48]}>
        <boxGeometry args={[0.03, 0.16, 0.12]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>
      <mesh position={[halfW - 0.02, 1.24, -0.48]}>
        <boxGeometry args={[0.025, 0.1, 0.34]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.35} />
      </mesh>

      {/* ================================================================= */}
      {/* 4. LEFT WALL (-X = -2.40): Continuous Wall + Recessed Red-Box Door */}
      {/* ================================================================= */}
      {/* Main continuous West wall from NW doorway (Z: -2.44) cleanly past washbasin to Z: +2.82 */}
      <mesh position={[-halfW - wallThickness / 2, height / 2, 0.19]} receiveShadow>
        <boxGeometry args={[wallThickness, height, 5.26]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      {/* Header over recessed bathroom doorway (Z: +2.82 .. +3.52, Y: 2.10 .. 2.88) */}
      <mesh position={[-halfW - wallThickness / 2, 2.49, 3.17]} receiveShadow>
        <boxGeometry args={[wallThickness, 0.78, 0.7]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      {/* SW corner pier connecting into Back End Wall (Z: +3.52 .. +3.86) */}
      <mesh position={[-halfW - wallThickness / 2, height / 2, 3.69]} receiveShadow>
        <boxGeometry args={[wallThickness, height, 0.34]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>

      {/* Curtained doorway ('left hallway' photo) with wooden door directly under lattice ventilation grille */}
      <TiedDoorCurtains
        position={[-halfW + 0.02, 0, -0.15]}
        rotationY={Math.PI / 2}
        width={0.94}
        height={2.02}
        curtainTex={textures.curtainFloral}
        doorTex={textures.teakWood}
        doorColor="#5b3218"
      />
      <HallwayLatticeVent position={[-halfW + 0.02, 2.38, -0.15]} rotationY={Math.PI / 2} wallMap={textures.wallAlbedo} />

      {/* ================================================================= */}
      {/* 5. BACK WALL (+Z = +2.20): Segmented for Dual 5ft Hallways & Doors */}
      {/* ================================================================= */}
      {/* Far-East corner pier (X: +2.06 .. +2.54) */}
      <mesh position={[2.3, height / 2, halfD + wallThickness / 2]} receiveShadow>
        <boxGeometry args={[0.48, height, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      {/* Back-Left 5ft Hallway Header (X: +1.16 .. +2.06, Y: 2.10 .. 2.88) */}
      <mesh position={[1.61, 2.49, halfD + wallThickness / 2]} receiveShadow>
        <boxGeometry args={[0.9, 0.78, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      {/* Center Back Wall (X: -1.10 .. +1.16: Brown Door + Column + Purifier bay) */}
      <mesh position={[0.03, height / 2, halfD + wallThickness / 2]} receiveShadow>
        <boxGeometry args={[2.26, height, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>
      {/* Unified Back-Right 5ft Hallway Header (X: -2.40 .. -1.10, Y: 2.10 .. 2.88) connecting into West wall */}
      <mesh position={[-1.75, 2.49, halfD + wallThickness / 2]} receiveShadow>
        <boxGeometry args={[1.3, 0.78, wallThickness]} />
        <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
      </mesh>

      {/* Back-Left 5-Foot Hallway (+Z: 2.20 .. 3.72 = 1.52m, X: +1.16 .. +2.06) [Green Arrow Starting Bedroom Door] */}
      <group name="BackLeftFiveFootHallway">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.61, 0, 2.96]} receiveShadow>
          <planeGeometry args={[0.9, 1.56]} />
          <meshStandardMaterial map={textures.floorDarkAlbedo} bumpMap={textures.floorBump} bumpScale={0.012} roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[1.61, 2.38, 2.96]}>
          <planeGeometry args={[0.9, 1.56]} />
          <meshStandardMaterial color="#d4deda" roughness={0.92} />
        </mesh>
        {/* Left (+X = 2.13) & Right (+X = 1.09) walls + End wall (Z = 3.79) */}
        <mesh position={[2.13, height / 2, 3.03]} receiveShadow>
          <boxGeometry args={[wallThickness, height, 1.52]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[1.09, height / 2, 3.03]} receiveShadow>
          <boxGeometry args={[wallThickness, height, 1.52]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[1.61, height / 2, 3.79]} receiveShadow>
          <boxGeometry args={[1.18, height, wallThickness]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[2.052, baseboardHeight / 2, 2.96]} receiveShadow>
          <boxGeometry args={[0.016, baseboardHeight, 1.52]} />
          <meshStandardMaterial color="#361c14" roughness={0.6} />
        </mesh>
        <mesh position={[1.168, baseboardHeight / 2, 2.96]} receiveShadow>
          <boxGeometry args={[0.016, baseboardHeight, 1.52]} />
          <meshStandardMaterial color="#361c14" roughness={0.6} />
        </mesh>
        {/* Paneled Wooden Door Inside Back-Left 5-ft Hallway (Z = 3.69) */}
        <PanelWoodDoor
          position={[1.61, 0, 3.69]}
          rotationY={Math.PI}
          width={0.84}
          height={2.04}
          color="#7c4724"
          teakTex={textures.teakWood}
        />
        <pointLight
          position={[1.61, 2.15, 3.02]}
          color="#f8fcff"
          intensity={roomLightOn ? 2.1 : 0.15}
          distance={4.5}
          decay={1.6}
        />
      </group>

      {/* Unified Back-Right 5-Foot Hallway (+Z: 2.20 .. 3.72 = 1.52m, X: -2.40 .. -1.10) */}
      <group name="BackRightFiveFootHallway">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.75, 0, 2.96]} receiveShadow>
          <planeGeometry args={[1.3, 1.56]} />
          <meshStandardMaterial map={textures.floorRedAlbedo} bumpMap={textures.floorBump} bumpScale={0.012} roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-1.75, 2.38, 2.96]}>
          <planeGeometry args={[1.3, 1.56]} />
          <meshStandardMaterial color="#d4deda" roughness={0.92} />
        </mesh>
        {/* East inner wall (-1.03) & Back end wall (Z = 3.79, connects flush into West wall X = -2.40) */}
        <mesh position={[-1.03, height / 2, 3.03]} receiveShadow>
          <boxGeometry args={[wallThickness, height, 1.52]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[-1.75, height / 2, 3.79]} receiveShadow>
          <boxGeometry args={[1.58, height, wallThickness]} />
          <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
        </mesh>
        <mesh position={[-1.108, baseboardHeight / 2, 2.96]} receiveShadow>
          <boxGeometry args={[0.016, baseboardHeight, 1.52]} />
          <meshStandardMaterial color="#361c14" roughness={0.6} />
        </mesh>
        {/* Entrance rod & tied floral curtain on East pier matching 'back hallway' photo */}
        <mesh position={[-1.56, 2.06, 2.18]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.011, 0.011, 1.0, 10]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[-1.18, 1.05, 2.19]} castShadow>
          <cylinderGeometry args={[0.062, 0.05, 1.9, 12]} />
          <meshStandardMaterial map={textures.curtainFloral} roughness={0.85} />
        </mesh>
        {/* Wall Switchboard along continuous West Wall (washbasin & bucket removed) */}
        <mesh position={[-halfW + 0.02, 1.18, 2.2]}>
          <boxGeometry args={[0.02, 0.09, 0.14]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        {/* Recessed Narrow Tan Bathroom Door at Marked Red-Box Position (-X: -2.40 .. -2.82, Z: +2.82 .. +3.52) */}
        <group name="RedBoxRecessedBathroomDoor">
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.61, 0, 3.17]} receiveShadow>
            <planeGeometry args={[0.44, 0.7]} />
            <meshStandardMaterial map={textures.floorRedAlbedo} roughness={0.9} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[-2.61, 2.1, 3.17]}>
            <planeGeometry args={[0.44, 0.7]} />
            <meshStandardMaterial color="#d4deda" roughness={0.92} />
          </mesh>
          <mesh position={[-2.65, height / 2, 2.75]} receiveShadow>
            <boxGeometry args={[0.48, height, wallThickness]} />
            <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
          </mesh>
          <mesh position={[-2.65, height / 2, 3.59]} receiveShadow>
            <boxGeometry args={[0.48, height, wallThickness]} />
            <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
          </mesh>
          <mesh position={[-2.89, height / 2, 3.17]} receiveShadow>
            <boxGeometry args={[wallThickness, height, 0.98]} />
            <meshStandardMaterial map={textures.wallAlbedo} bumpMap={textures.wallBump} bumpScale={0.008} roughness={0.86} />
          </mesh>
          <PanelWoodDoor
            position={[-2.79, 0, 3.17]}
            rotationY={Math.PI / 2}
            width={0.66}
            height={2.02}
            color="#a68b67"
            frameColor="#7a6244"
            teakTex={textures.teakWood}
          />
        </group>
        {/* Single Wooden Door at Back End of Back-Right 5ft Hallway (Red-X Tan Door Removed) */}
        <PanelWoodDoor
          position={[-1.56, 0, 3.69]}
          rotationY={Math.PI}
          width={0.78}
          height={2.04}
          color="#6b3c1f"
          teakTex={textures.teakWood}
        />
        <pointLight
          position={[-1.75, 2.15, 3.02]}
          color="#f8fcff"
          intensity={roomLightOn ? 2.3 : 0.16}
          distance={4.8}
          decay={1.55}
        />
      </group>

      {/* Central protruding column supporting overhead beam */}
      <mesh position={[-0.08, height / 2, halfD - 0.16]} castShadow receiveShadow>
        <boxGeometry args={[0.26, height, 0.32]} />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
      </mesh>

      {/* Brown 4-slat wooden door (left of center column when facing Back) */}
      <group name="BackBrownDoor" position={[0.56, 0, halfD - 0.03]}>
        <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.84, 2.04, 0.04]} />
          <meshStandardMaterial map={textures.teakWood} color="#7c4724" roughness={0.64} />
        </mesh>
        <mesh position={[0, 2.1, -0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.94, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.3} />
        </mesh>
        <HallwayLatticeVent position={[0, 2.42, 0.01]} rotationY={Math.PI} wallMap={textures.wallAlbedo} />
      </group>

      {/* Water Purifier on 3-Tier Stand, 2025 Calendar & 4-Antenna Wi-Fi Router (right of column) */}
      <group name="BackPurifierAndRouterBay" position={[-0.66, 0, halfD - 0.24]}>
        {/* Stand */}
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.72, 0.36]} />
          <meshStandardMaterial color="#1f2937" roughness={0.65} />
        </mesh>
        {/* Pureit Water Purifier */}
        <mesh position={[0, 0.94, 0]} castShadow>
          <boxGeometry args={[0.3, 0.44, 0.28]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.9, -0.145]}>
          <boxGeometry args={[0.2, 0.24, 0.015]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        {/* Blue 2025 Wall Calendar behind purifier */}
        <mesh position={[0, 1.48, 0.21]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.42, 0.56]} />
          <meshStandardMaterial map={textures.calendar2025} roughness={0.7} />
        </mesh>
        {/* Black Wi-Fi Router + 4 Antennas mounted high */}
        <group position={[-0.08, 2.08, 0.16]}>
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.04, 0.14]} />
            <meshStandardMaterial color="#111827" roughness={0.45} />
          </mesh>
          {[-0.07, -0.025, 0.025, 0.07].map((ax, i) => (
            <mesh key={i} position={[ax, 0.09, 0.04]} rotation={[0.15, 0, (i - 1.5) * 0.1]}>
              <cylinderGeometry args={[0.005, 0.006, 0.16, 6]} />
              <meshStandardMaterial color="#18181b" roughness={0.5} />
            </mesh>
          ))}
        </group>
        <HallwayLatticeVent position={[0.02, 2.42, 0.2]} rotationY={Math.PI} wallMap={textures.wallAlbedo} />
      </group>

      {/* Dark brown baseboards along perimeter walls (excluding open passages) */}
      <mesh position={[-0.36, baseboardHeight / 2, -halfD + 0.008]} receiveShadow>
        <boxGeometry args={[2.64, baseboardHeight, 0.016]} />
        <meshStandardMaterial color="#361c14" roughness={0.6} />
      </mesh>
      <mesh position={[2.1, baseboardHeight / 2, -halfD + 0.008]} receiveShadow>
        <boxGeometry args={[0.6, baseboardHeight, 0.016]} />
        <meshStandardMaterial color="#361c14" roughness={0.6} />
      </mesh>
      {/* Continuous East wall baseboard (Yellow-X passage removed) */}
      <mesh position={[halfW - 0.008, baseboardHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[0.016, baseboardHeight, depth]} />
        <meshStandardMaterial color="#361c14" roughness={0.6} />
      </mesh>
      {/* West wall baseboards flanking recessed bathroom doorway (Z: +2.82 .. +3.52) */}
      <mesh position={[-halfW + 0.008, baseboardHeight / 2, 0.31]} receiveShadow>
        <boxGeometry args={[0.016, baseboardHeight, 5.02]} />
        <meshStandardMaterial color="#361c14" roughness={0.6} />
      </mesh>
      <mesh position={[-halfW + 0.008, baseboardHeight / 2, 3.62]} receiveShadow>
        <boxGeometry args={[0.016, baseboardHeight, 0.2]} />
        <meshStandardMaterial color="#361c14" roughness={0.6} />
      </mesh>

      {/* Marked Starting Bedroom Door (Green Arrow in annotated screenshot): RETURN TO BEDROOM Button */}
      <BalconyEntrance
        position={[1.61, 1.48, 3.59]}
        rotationY={Math.PI}
        label={isTransitioning ? 'Returning...' : 'RETURN TO BEDROOM'}
        icon="home"
        accent="emerald"
        disabled={isTransitioning}
        onActivate={onReturnToBedroom}
        onPreload={onPreloadBedroom}
      />
    </group>
  );
}

function HallwayLightingAndControls({
  activePreset,
  presetTrigger,
  roomLightOn,
  isSoftwareGl,
  reducedMotion,
  scriptedGlide,
  onCameraApproach,
}: {
  activePreset: HallwayPresetId;
  presetTrigger: number;
  roomLightOn: boolean;
  isSoftwareGl: boolean;
  reducedMotion: boolean;
  scriptedGlide: { position: [number, number, number]; target: [number, number, number] } | null;
  onCameraApproach?: (pos: THREE.Vector3) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const frontBulbRef = useRef<THREE.PointLight>(null);
  const rightBulbRef = useRef<THREE.PointLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const bulb1MatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bulb2MatRef = useRef<THREE.MeshStandardMaterial>(null);

  const { camera, gl, scene } = useThree();
  const isTransitioningRef = useRef(false);
  const isScriptedRef = useRef(false);
  const didInitTargetRef = useRef(false);

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = roomLightOn ? 0.34 : 0.14;
    pmremGenerator.dispose();

    return () => {
      scene.environment = null;
      envTex.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    if (!didInitTargetRef.current && controlsRef.current) {
      const preset = HALLWAY_PRESETS[activePreset] || HALLWAY_PRESETS.overview;
      controlsRef.current.target.set(...preset.target);
      controlsRef.current.update();
      didInitTargetRef.current = true;
    }
  }, [activePreset]);

  useEffect(() => {
    if (scriptedGlide) return;
    const preset = HALLWAY_PRESETS[activePreset] || HALLWAY_PRESETS.overview;
    _desiredPos.set(...preset.position);
    _desiredTarget.set(...preset.target);
    isScriptedRef.current = false;

    if (reducedMotion) {
      camera.position.copy(_desiredPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(_desiredTarget);
        controlsRef.current.update();
      }
      isTransitioningRef.current = false;
    } else {
      isTransitioningRef.current = true;
    }
  }, [activePreset, presetTrigger, camera, reducedMotion, scriptedGlide]);

  useEffect(() => {
    if (!scriptedGlide) return;
    _desiredPos.set(...scriptedGlide.position);
    _desiredTarget.set(...scriptedGlide.target);
    isScriptedRef.current = true;
    isTransitioningRef.current = true;
  }, [scriptedGlide]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancel = () => {
      if (!isScriptedRef.current) isTransitioningRef.current = false;
    };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, []);

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current;
    const delta = Math.min(rawDelta, 0.05);

    const lightLerp = reducedMotion ? 60 : 5.2;
    if (frontBulbRef.current) {
      frontBulbRef.current.intensity = THREE.MathUtils.damp(
        frontBulbRef.current.intensity,
        roomLightOn ? 11.5 : 0.45,
        lightLerp,
        delta,
      );
    }
    if (rightBulbRef.current) {
      rightBulbRef.current.intensity = THREE.MathUtils.damp(
        rightBulbRef.current.intensity,
        roomLightOn ? 10.5 : 0.45,
        lightLerp,
        delta,
      );
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.damp(
        hemiRef.current.intensity,
        roomLightOn ? 0.62 : 0.22,
        lightLerp,
        delta,
      );
    }
    [bulb1MatRef.current, bulb2MatRef.current].forEach((m) => {
      if (m) {
        m.emissiveIntensity = THREE.MathUtils.damp(
          m.emissiveIntensity,
          roomLightOn ? 2.4 : 0.05,
          lightLerp,
          delta,
        );
      }
    });
    scene.environmentIntensity = THREE.MathUtils.damp(
      scene.environmentIntensity,
      roomLightOn ? 0.34 : 0.14,
      lightLerp,
      delta,
    );

    if (!controls) return;

    if (isTransitioningRef.current) {
      const lambda = isScriptedRef.current ? 4.4 : 5.5;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredPos.x, lambda, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredPos.y, lambda, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredPos.z, lambda, delta);

      controls.target.x = THREE.MathUtils.damp(controls.target.x, _desiredTarget.x, lambda, delta);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, _desiredTarget.y, lambda, delta);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, _desiredTarget.z, lambda, delta);

      if (
        camera.position.distanceToSquared(_desiredPos) < 0.0004 &&
        controls.target.distanceToSquared(_desiredTarget) < 0.0004
      ) {
        camera.position.copy(_desiredPos);
        controls.target.copy(_desiredTarget);
        isTransitioningRef.current = false;
      }
    }

    if (!isScriptedRef.current) {
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -2.55, 2.0);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.5, 2.05);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -3.75, 3.35);
    }

    controls.update();
    if (!isScriptedRef.current) {
      clampCameraInsideHallway(camera.position);
    }
    if (onCameraApproach) {
      onCameraApproach(camera.position);
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={!isSoftwareGl}
        dampingFactor={0.06}
        enablePan={true}
        panSpeed={0.6}
        rotateSpeed={0.65}
        zoomSpeed={0.85}
        minDistance={0.4}
        maxDistance={2.8}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI * 0.78}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      <hemisphereLight
        ref={hemiRef}
        args={['#d8eee2', '#1a241f', roomLightOn ? 0.62 : 0.22]}
      />

      {/* Front-Left LED Bulb above Walton Fridge */}
      <mesh position={[-1.52, 2.28, -HALLWAY_DIMENSIONS.depth / 2 + 0.04]}>
        <sphereGeometry args={[0.044, 14, 14]} />
        <meshStandardMaterial
          ref={bulb1MatRef}
          color="#ffffff"
          emissive="#f8fafc"
          emissiveIntensity={roomLightOn ? 2.4 : 0.05}
          roughness={0.2}
        />
      </mesh>
      <pointLight
        ref={frontBulbRef}
        position={[-1.4, 2.22, -1.92]}
        color="#f8fcff"
        intensity={roomLightOn ? 11.5 : 0.45}
        distance={9}
        decay={1.4}
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0015}
      />

      {/* Right-Wall LED Bulb ('right hallway' photo) */}
      <mesh position={[HALLWAY_DIMENSIONS.width / 2 - 0.04, 2.18, -0.48]}>
        <sphereGeometry args={[0.044, 14, 14]} />
        <meshStandardMaterial
          ref={bulb2MatRef}
          color="#ffffff"
          emissive="#f8fafc"
          emissiveIntensity={roomLightOn ? 2.4 : 0.05}
          roughness={0.2}
        />
      </mesh>
      <pointLight
        ref={rightBulbRef}
        position={[2.12, 2.14, -0.48]}
        color="#f8fcff"
        intensity={roomLightOn ? 10.5 : 0.45}
        distance={9}
        decay={1.45}
      />
    </>
  );
}

export default function MainHallwayScene({
  activePreset,
  presetTrigger,
  roomLightOn,
  fanRunning,
  enteredFromRoom = false,
  hallwayGroupRef,
  onReturnToBedroom,
  onTransitionChange,
  onPreloadBedroom,
}: MainHallwaySceneProps) {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const [contextLost, setContextLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scriptedGlide, setScriptedGlide] = useState<{
    position: [number, number, number];
    target: [number, number, number];
  } | null>(null);

  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);
  const textures = useMemo(() => createHallwayTextures(8), []);
  const timersRef = useRef<number[]>([]);
  const preloadedRoomRef = useRef(false);
  const transitionLockRef = useRef(false);

  useEffect(() => {
    return () => {
      textures.dispose();
    };
  }, [textures]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const el = canvasDomRef.current;
    if (!el) return;
    const onLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onRestored = () => setContextLost(false);
    el.addEventListener('webglcontextlost', onLost);
    el.addEventListener('webglcontextrestored', onRestored);
    return () => {
      el.removeEventListener('webglcontextlost', onLost);
      el.removeEventListener('webglcontextrestored', onRestored);
    };
  }, []);

  const handleReturnBedroom = useCallback(() => {
    if (transitionLockRef.current || isTransitioning) return;
    transitionLockRef.current = true;
    onPreloadBedroom();
    setIsTransitioning(true);

    if (reducedMotion) {
      onTransitionChange(true, 'Returning to Bedroom');
      const t = window.setTimeout(() => {
        onReturnToBedroom();
      }, 280);
      timersRef.current.push(t);
      return;
    }

    setScriptedGlide({
      position: [1.61, 1.36, 3.12],
      target: [1.61, 1.28, 3.72],
    });

    const t1 = window.setTimeout(() => {
      onTransitionChange(true, 'Returning to Bedroom');
    }, 420);
    const t2 = window.setTimeout(() => {
      onReturnToBedroom();
    }, 920);

    timersRef.current.push(t1, t2);
  }, [isTransitioning, onPreloadBedroom, onReturnToBedroom, onTransitionChange, reducedMotion]);

  const handleApproachCheck = useCallback(
    (pos: THREE.Vector3) => {
      if (preloadedRoomRef.current) return;
      if (pos.x > 0.9 && pos.z > 1.7) {
        preloadedRoomRef.current = true;
        onPreloadBedroom();
      }
    },
    [onPreloadBedroom],
  );

  const initialPreset = HALLWAY_PRESETS.overview;
  const startCameraPos: [number, number, number] = enteredFromRoom
    ? [1.61, 1.42, 2.35]
    : initialPreset.position;

  return (
    <SceneErrorBoundary>
      <div className="relative h-full w-full bg-[#0b1310]">
        {contextLost && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1310]/90 text-sm text-zinc-200">
            Restoring 3D graphics context...
          </div>
        )}
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          camera={{
            position: startCameraPos,
            fov: 64,
            near: 0.08,
            far: 30,
          }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.06,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onCreated={({ gl }) => {
            canvasDomRef.current = gl.domElement;
          }}
        >
          <color attach="background" args={['#0d1813']} />
          <MainHallwayWorld
            hallwayGroupRef={hallwayGroupRef}
            textures={textures}
            roomLightOn={roomLightOn}
            fanRunning={fanRunning && !reducedMotion}
            isTransitioning={isTransitioning}
            onReturnToBedroom={handleReturnBedroom}
            onPreloadBedroom={onPreloadBedroom}
          />
          <HallwayLightingAndControls
            activePreset={activePreset}
            presetTrigger={presetTrigger}
            roomLightOn={roomLightOn}
            isSoftwareGl={isSoftwareGl}
            reducedMotion={reducedMotion}
            scriptedGlide={scriptedGlide}
            onCameraApproach={handleApproachCheck}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
