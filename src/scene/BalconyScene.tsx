import {
  Component,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createBalconyTextures, BalconyTextureSet } from './balconyTextures';
import { createRoomTextures } from './proceduralTextures';
import { ROOM_BOUNDS } from './roomConstants';
import { RoomArchitecture } from './components/RoomArchitecture';
import { WorkstationArea } from './components/WorkstationArea';
import { StorageAndDecor } from './components/StorageAndDecor';
import { BedAndWindows } from './components/BedAndWindows';
import {
  BALCONY_BOUNDS,
  BALCONY_COLLIDERS,
  BALCONY_DIMENSIONS,
  BALCONY_PRESETS,
  BalconyPresetId,
} from './balconyConstants';
import { BalconyEntrance } from './components/BalconyEntrance';

interface BalconySceneProps {
  activePreset: BalconyPresetId;
  presetTrigger: number;
  roomLightOn: boolean;
  enteredFromRoom?: boolean;
  balconyGroupRef: React.RefObject<THREE.Group | null>;
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
            <h2 className="text-xl font-semibold">3D Balcony Unavailable</h2>
            <p className="text-sm text-zinc-400">
              WebGL could not initialize on this device. Please refresh to view the balcony.
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

function clampCameraInsideBalcony(pos: THREE.Vector3): void {
  const wallMargin = 0.16;
  pos.x = THREE.MathUtils.clamp(
    pos.x,
    BALCONY_BOUNDS.minX + wallMargin,
    BALCONY_BOUNDS.maxX - wallMargin,
  );
  pos.y = THREE.MathUtils.clamp(pos.y, 0.44, BALCONY_BOUNDS.maxY - 0.3);
  pos.z = THREE.MathUtils.clamp(
    pos.z,
    BALCONY_BOUNDS.minZ + wallMargin,
    BALCONY_BOUNDS.maxZ - wallMargin,
  );

  const pad = 0.09;
  for (let i = 0; i < BALCONY_COLLIDERS.length; i++) {
    const box = BALCONY_COLLIDERS[i];
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

function SecurityGrilleSpan({
  position,
  rotationY = 0,
  spanWidth,
  height = 1.46,
  bays = 10,
}: {
  position: [number, number, number];
  rotationY?: number;
  spanWidth: number;
  height?: number;
  bays?: number;
}) {
  const stepX = spanWidth / bays;
  const rungCount = 6;
  const rungStepY = height / (rungCount + 1);

  return (
    <group name="SecurityGrille" position={position} rotation={[0, rotationY, 0]}>
      {/* Top & Bottom steel frame bars */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[spanWidth, 0.022, 0.022]} />
        <meshStandardMaterial color="#59351e" roughness={0.72} metalness={0.35} />
      </mesh>
      <mesh position={[0, -height / 2, 0]} castShadow>
        <boxGeometry args={[spanWidth, 0.022, 0.022]} />
        <meshStandardMaterial color="#59351e" roughness={0.72} metalness={0.35} />
      </mesh>

      {/* Vertical bars */}
      {Array.from({ length: bays + 1 }).map((_, idx) => {
        const vx = -spanWidth / 2 + idx * stepX;
        return (
          <mesh key={`v-${idx}`} position={[vx, 0, 0]} castShadow>
            <boxGeometry args={[0.016, height, 0.016]} />
            <meshStandardMaterial color="#683e23" roughness={0.75} metalness={0.32} />
          </mesh>
        );
      })}

      {/* Alternating ladder horizontal rungs matching 'balcony front.' */}
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

function BalconyPottedPlant({
  position,
  scale = 1,
  textures,
}: {
  position: [number, number, number];
  scale?: number;
  textures: BalconyTextureSet;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.095, 0.28, 16]} />
        <meshStandardMaterial color="#38342e" roughness={0.85} />
      </mesh>
      {/* Trunk / stem */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.022, 0.38, 8]} />
        <meshStandardMaterial color="#4e3d28" roughness={0.88} />
      </mesh>
      {/* Crossed lush leaf sprays */}
      {[0, Math.PI / 3, (Math.PI * 2) / 3].map((rotY, idx) => (
        <mesh
          key={idx}
          position={[0, 0.62 + idx * 0.04, 0]}
          rotation={[0.28 * (idx - 1), rotY, 0.12]}
          castShadow
        >
          <planeGeometry args={[0.54, 0.48]} />
          <meshStandardMaterial
            map={textures.mangoLeaf}
            transparent
            alphaTest={0.25}
            side={THREE.DoubleSide}
            roughness={0.75}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Mounts the real existing Bedroom components directly behind the balcony entrance
 * so looking through the doorway reveals the genuine 3D bedroom environment.
 */
function ConnectedRealBedroom({ roomLightOn }: { roomLightOn: boolean }) {
  const roomTextures = useMemo(() => createRoomTextures(8), []);
  const bedroomRef = useRef<THREE.Group>(null);

  useEffect(() => {
    return () => {
      roomTextures.dispose();
    };
  }, [roomTextures]);

  // Hide the bedroom's exterior doorway preview box so it doesn't overlap the real balcony space
  useLayoutEffect(() => {
    const group = bedroomRef.current;
    if (!group) return;
    const vestibule = group.getObjectByName('BalconyDoorVestibule');
    if (vestibule) {
      vestibule.visible = false;
    }
  }, []);

  return (
    <group ref={bedroomRef} name="ConnectedBedroomInterior">
      <RoomArchitecture
        textures={roomTextures}
        fanRunning={false}
        balconyDoorOpen={true}
      />
      <WorkstationArea textures={roomTextures} />
      <StorageAndDecor textures={roomTextures} />
      <BedAndWindows textures={roomTextures} />

      {/* Main interior bedroom light so the doorway view matches the lit room screenshot */}
      <group position={[0.06, 2.34, ROOM_BOUNDS.minZ + 0.02]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.09, 0.09, 0.025]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <sphereGeometry args={[0.042, 14, 14]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#f8fafc"
            emissiveIntensity={roomLightOn ? 2.2 : 0.35}
            roughness={0.2}
          />
        </mesh>
      </group>
      <pointLight
        position={[0.06, 2.28, ROOM_BOUNDS.minZ + 0.24]}
        color="#f8fcff"
        intensity={roomLightOn ? 12.5 : 3.2}
        distance={9}
        decay={1.45}
      />
      <pointLight
        position={[0.18, 1.05, -1.12]}
        color="#7c8dff"
        intensity={0.85}
        distance={2.8}
        decay={1.7}
      />
    </group>
  );
}

function BalconyWorld({
  balconyGroupRef,
  textures,
  roomLightOn,
  isTransitioning,
  onReturnToBedroom,
  onPreloadBedroom,
}: {
  balconyGroupRef: React.RefObject<THREE.Group | null>;
  textures: BalconyTextureSet;
  roomLightOn: boolean;
  isTransitioning: boolean;
  onReturnToBedroom: () => void;
  onPreloadBedroom: () => void;
}) {
  const { width, depth, height, wallThickness, parapetHeight, grilleTopY } =
    BALCONY_DIMENSIONS;
  const { minX, maxX, minZ, maxZ } = BALCONY_BOUNDS;
  const centerX = (minX + maxX) / 2; // +0.475
  const centerZ = (minZ + maxZ) / 2; // +2.58
  const grilleHeight = grilleTopY - parapetHeight; // 1.46
  const grilleCenterY = parapetHeight + grilleHeight / 2; // 1.45

  return (
    <group ref={balconyGroupRef} name="BalconyEnvironment">
      {/* Real Connected Bedroom Scene visible through the Balcony Entrance Door */}
      <ConnectedRealBedroom roomLightOn={roomLightOn} />

      {/* Mint-green exterior wall continuation past bedroom's +X edge (X: +2.04 to +2.99) */}
      <mesh position={[2.515, height / 2, 1.87]} receiveShadow>
        <boxGeometry args={[0.95, height, wallThickness]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>

      {/* Seamless Concrete Doorway Threshold Strip bridging Bedroom Floor (1.80) and Balcony (1.94) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.36, 0.002, 1.87]} receiveShadow>
        <planeGeometry args={[0.84, 0.16]} />
        <meshStandardMaterial
          map={textures.floorConcrete}
          bumpMap={textures.floorBump}
          bumpScale={0.012}
          roughness={0.92}
        />
      </mesh>

      {/* Balcony Exterior Concrete Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          map={textures.floorConcrete}
          bumpMap={textures.floorBump}
          bumpScale={0.014}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* Ceiling Overhang Slab */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[centerX, height, centerZ]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#c4ccc8" roughness={0.94} />
      </mesh>

      {/* LEFT SIDE (-X = -1.90, extended depth 1.68m): Continuous Solid Mint-Green Concrete Wall */}
      <mesh position={[minX - wallThickness / 2, height / 2, centerZ]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial
          map={textures.wallAlbedo}
          bumpMap={textures.wallBump}
          bumpScale={0.008}
          roughness={0.86}
        />
      </mesh>

      {/* FRONT SIDE (+Z = +3.62, slightly shorter width 3.35m): Parapet, Ledge, Grille, Upper Beam, Clothespins, Jar */}
      <mesh position={[centerX, parapetHeight / 2, maxZ + wallThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width + wallThickness * 2, parapetHeight, wallThickness]} />
        <meshStandardMaterial map={textures.parapetWeathered} roughness={0.9} />
      </mesh>
      <mesh position={[centerX, parapetHeight + 0.015, maxZ - 0.02]} receiveShadow>
        <boxGeometry args={[width, 0.032, 0.16]} />
        <meshStandardMaterial map={textures.parapetWeathered} roughness={0.88} />
      </mesh>
      <mesh
        position={[centerX, (grilleTopY + height) / 2, maxZ + wallThickness / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[width + wallThickness * 2, height - grilleTopY, wallThickness]}
        />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.88} />
      </mesh>
      <SecurityGrilleSpan
        position={[centerX, grilleCenterY, maxZ + 0.01]}
        rotationY={0}
        spanWidth={width}
        height={grilleHeight}
        bays={16}
      />

      {/* Horizontal Taut Clothesline Wires & Clips */}
      {[1.84, 1.56].map((ly, idx) => (
        <mesh key={idx} position={[centerX, ly, maxZ - 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0025, 0.0025, width - 0.2, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {[
        { x: -0.78, col: '#4ade80' },
        { x: -0.68, col: '#4ade80' },
        { x: -0.61, col: '#eab308' },
      ].map((peg, idx) => (
        <mesh key={idx} position={[peg.x, 1.82, maxZ - 0.02]} castShadow>
          <boxGeometry args={[0.016, 0.065, 0.02]} />
          <meshStandardMaterial color={peg.col} roughness={0.45} />
        </mesh>
      ))}

      {/* Clear Cylindrical Plastic Jar with Green Band & Lid on Front Parapet Ledge */}
      <group name="BalconyParapetJar" position={[-0.45, parapetHeight + 0.125, maxZ - 0.03]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.19, 18]} />
          <meshStandardMaterial
            color="#d9f0df"
            transparent
            opacity={0.48}
            roughness={0.18}
          />
        </mesh>
        <mesh position={[0, 0.095, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.02, 18]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.06, 18]} />
          <meshStandardMaterial color="#a3c978" roughness={0.5} />
        </mesh>
      </group>

      {/* RIGHT SIDE (+X = +2.85): Low Parapet, Upper Beam, End Security Grille & Hanging Potted Baskets */}
      <mesh position={[maxX + wallThickness / 2, parapetHeight / 2, centerZ]} receiveShadow>
        <boxGeometry args={[wallThickness, parapetHeight, depth]} />
        <meshStandardMaterial map={textures.parapetWeathered} roughness={0.9} />
      </mesh>
      <mesh position={[maxX + wallThickness / 2, (grilleTopY + height) / 2, centerZ]} receiveShadow>
        <boxGeometry args={[wallThickness, height - grilleTopY, depth]} />
        <meshStandardMaterial map={textures.wallAlbedo} roughness={0.88} />
      </mesh>
      <SecurityGrilleSpan
        position={[maxX + 0.01, grilleCenterY, centerZ]}
        rotationY={Math.PI / 2}
        spanWidth={depth}
        height={grilleHeight}
        bays={5}
      />

      {/* Hanging Dark Potted Vines suspended along Right End Grille & Front-Right Grille */}
      {[
        [maxX - 0.12, 1.55, centerZ - 0.18],
        [maxX - 0.12, 1.48, centerZ + 0.22],
        [maxX - 0.55, 1.52, maxZ - 0.12],
      ].map(([hx, hy, hz], idx) => (
        <group key={idx} position={[hx, hy, hz]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.075, 0.13, 14]} />
            <meshStandardMaterial color="#18181b" roughness={0.75} />
          </mesh>
          {[0, Math.PI / 2].map((rotY, pIdx) => (
            <mesh key={pIdx} position={[0, 0.16, 0]} rotation={[0, rotY + idx * 0.4, 0]}>
              <planeGeometry args={[0.38, 0.36]} />
              <meshStandardMaterial
                map={textures.mangoLeaf}
                transparent
                alphaTest={0.25}
                side={THREE.DoubleSide}
                roughness={0.78}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Potted Mango Sapling & Lush Floor Plants along Extended Balcony Corridor */}
      <BalconyPottedPlant position={[-0.25, 0, minZ + 0.24]} scale={1.12} textures={textures} />
      <BalconyPottedPlant position={[0.35, 0, minZ + 0.24]} scale={0.92} textures={textures} />
      <BalconyPottedPlant position={[1.15, 0, minZ + 0.24]} scale={1.02} textures={textures} />
      <BalconyPottedPlant position={[1.85, 0, minZ + 0.24]} scale={0.95} textures={textures} />
      <BalconyPottedPlant position={[2.48, 0, centerZ - 0.08]} scale={0.86} textures={textures} />

      {/* Brown Slatted Wooden Window Shutters on Bedroom Exterior Wall */}
      <group name="ExteriorWoodShutters" position={[0.36, 1.36, minZ + 0.022]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.88, 1.46, 0.04]} />
          <meshStandardMaterial map={textures.woodShutter} roughness={0.68} />
        </mesh>
        {[-0.47, 0, 0.47].map((sx, idx) => (
          <mesh key={idx} position={[sx, 0, 0.022]}>
            <boxGeometry args={[0.014, 1.44, 0.012]} />
            <meshStandardMaterial color="#42220e" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* Exterior Decorative Lattice Vent High on Back Wall */}
      <group name="BalconyLatticeVent" position={[-0.66, 2.48, minZ + 0.015]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[0.36, 0.24]} />
          <meshStandardMaterial color="#0b120e" roughness={0.95} />
        </mesh>
        {[-0.1, 0, 0.1].map((x, idx) => (
          <mesh key={idx} position={[x, 0, 0.005]}>
            <boxGeometry args={[0.016, 0.22, 0.016]} />
            <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
          </mesh>
        ))}
        {[-0.06, 0, 0.06].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0.005]}>
            <boxGeometry args={[0.34, 0.016, 0.016]} />
            <meshStandardMaterial map={textures.wallAlbedo} roughness={0.86} />
          </mesh>
        ))}
      </group>

      {/* Exterior Twilight Dusk Sky Backdrop surrounding Front (+Z) & Right (+X) */}
      <mesh position={[centerX + 0.4, 1.45, maxZ + 1.85]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[11.5, 5.2]} />
        <meshBasicMaterial map={textures.twilightSky} />
      </mesh>
      <mesh position={[maxX + 1.85, 1.45, centerZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8.5, 5.2]} />
        <meshBasicMaterial map={textures.twilightSky} />
      </mesh>

      {/* 3D Interactive "RETURN TO ROOM" Button mounted on wall beside Balcony Entrance Door */}
      <BalconyEntrance
        position={[-0.78, 1.28, minZ + 0.06]}
        rotationY={0.28}
        label={isTransitioning ? 'Returning...' : 'RETURN TO ROOM'}
        icon="home"
        accent="emerald"
        disabled={isTransitioning}
        onActivate={onReturnToBedroom}
        onPreload={onPreloadBedroom}
      />
    </group>
  );
}

function BalconyLightingAndControls({
  activePreset,
  presetTrigger,
  roomLightOn,
  isSoftwareGl,
  reducedMotion,
  scriptedGlide,
  onCameraApproach,
}: {
  activePreset: BalconyPresetId;
  presetTrigger: number;
  roomLightOn: boolean;
  isSoftwareGl: boolean;
  reducedMotion: boolean;
  scriptedGlide: { position: [number, number, number]; target: [number, number, number] } | null;
  onCameraApproach?: (pos: THREE.Vector3) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const bulbPointRef = useRef<THREE.PointLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const bulbMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const { camera, gl, scene } = useThree();
  const isTransitioningRef = useRef(false);
  const isScriptedRef = useRef(false);
  const didInitTargetRef = useRef(false);

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = roomLightOn ? 0.34 : 0.18;
    pmremGenerator.dispose();

    return () => {
      scene.environment = null;
      envTex.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    if (!didInitTargetRef.current && controlsRef.current) {
      const preset = BALCONY_PRESETS[activePreset] || BALCONY_PRESETS.overview;
      controlsRef.current.target.set(...preset.target);
      controlsRef.current.update();
      didInitTargetRef.current = true;
    }
  }, [activePreset]);

  useEffect(() => {
    if (scriptedGlide) return;
    const preset = BALCONY_PRESETS[activePreset] || BALCONY_PRESETS.overview;
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
    if (bulbPointRef.current) {
      bulbPointRef.current.intensity = THREE.MathUtils.damp(
        bulbPointRef.current.intensity,
        roomLightOn ? 11.5 : 0.4,
        lightLerp,
        delta,
      );
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.damp(
        hemiRef.current.intensity,
        roomLightOn ? 0.65 : 0.36,
        lightLerp,
        delta,
      );
    }
    if (bulbMatRef.current) {
      bulbMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        bulbMatRef.current.emissiveIntensity,
        roomLightOn ? 2.5 : 0.06,
        lightLerp,
        delta,
      );
    }
    scene.environmentIntensity = THREE.MathUtils.damp(
      scene.environmentIntensity,
      roomLightOn ? 0.34 : 0.18,
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
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -1.62, 2.55);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.55, 2.05);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, 2.06, 3.04);
    }

    controls.update();
    if (!isScriptedRef.current) {
      clampCameraInsideBalcony(camera.position);
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
        panSpeed={0.55}
        rotateSpeed={0.65}
        zoomSpeed={0.8}
        minDistance={0.14}
        maxDistance={2.6}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI * 0.76}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      {/* Ambient dusk + emerald wall bounce */}
      <hemisphereLight
        ref={hemiRef}
        args={['#a8b8e6', '#182b20', roomLightOn ? 0.65 : 0.36]}
      />

      {/* Exterior Wall LED Bulb Fixture & Junction Box near Door */}
      <group name="BalconyWallBulb" position={[-0.92, 2.52, BALCONY_BOUNDS.minZ + 0.02]}>
        <mesh position={[-0.14, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.035]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshStandardMaterial
            ref={bulbMatRef}
            color="#ffffff"
            emissive="#f8fafc"
            emissiveIntensity={roomLightOn ? 2.5 : 0.06}
            roughness={0.2}
          />
        </mesh>
      </group>

      <pointLight
        ref={bulbPointRef}
        position={[-0.92, 2.42, BALCONY_BOUNDS.minZ + 0.28]}
        color="#f8fcff"
        intensity={roomLightOn ? 11.5 : 0.4}
        distance={8.5}
        decay={1.45}
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0015}
      />

      {/* Soft twilight dusk horizon fill coming through Front Grille */}
      <directionalLight
        position={[0.6, 1.8, BALCONY_BOUNDS.maxZ + 1.2]}
        color="#a879b8"
        intensity={0.72}
      />
    </>
  );
}

export default function BalconyScene({
  activePreset,
  presetTrigger,
  roomLightOn,
  enteredFromRoom = false,
  balconyGroupRef,
  onReturnToBedroom,
  onTransitionChange,
  onPreloadBedroom,
}: BalconySceneProps) {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const [contextLost, setContextLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scriptedGlide, setScriptedGlide] = useState<{
    position: [number, number, number];
    target: [number, number, number];
  } | null>(null);

  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);
  const textures = useMemo(() => createBalconyTextures(8), []);
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
      onTransitionChange(true, 'Returning to Room');
      const t = window.setTimeout(() => {
        onReturnToBedroom();
      }, 280);
      timersRef.current.push(t);
      return;
    }

    setScriptedGlide({
      position: [-1.34, 1.32, 2.24],
      target: [-1.36, 1.24, 0.72],
    });

    const t1 = window.setTimeout(() => {
      onTransitionChange(true, 'Returning to Room');
    }, 420);
    const t2 = window.setTimeout(() => {
      onReturnToBedroom();
    }, 920);

    timersRef.current.push(t1, t2);
  }, [isTransitioning, onPreloadBedroom, onReturnToBedroom, onTransitionChange, reducedMotion]);

  const handleApproachCheck = useCallback(
    (pos: THREE.Vector3) => {
      if (preloadedRoomRef.current) return;
      if (pos.x < -0.7 && pos.z < 2.45) {
        preloadedRoomRef.current = true;
        onPreloadBedroom();
      }
    },
    [onPreloadBedroom],
  );

  const initialPreset = BALCONY_PRESETS.overview;
  const startCameraPos: [number, number, number] = enteredFromRoom
    ? [-1.3, 1.38, 2.18]
    : initialPreset.position;

  return (
    <SceneErrorBoundary>
      <div className="relative h-full w-full bg-[#121626]">
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
            fov: 66,
            near: 0.06,
            far: 30,
          }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onCreated={({ gl }) => {
            canvasDomRef.current = gl.domElement;
          }}
        >
          <color attach="background" args={['#191c30']} />
          <BalconyWorld
            balconyGroupRef={balconyGroupRef}
            textures={textures}
            roomLightOn={roomLightOn}
            isTransitioning={isTransitioning}
            onReturnToBedroom={handleReturnBedroom}
            onPreloadBedroom={onPreloadBedroom}
          />
          <BalconyLightingAndControls
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
