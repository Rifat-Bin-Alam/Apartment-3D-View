import {
  Component,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { createRoomTextures } from './proceduralTextures';
import { CAMERA_PRESETS, CameraPreset, ROOM_DIMENSIONS } from './roomConstants';
import { RoomArchitecture } from './components/RoomArchitecture';
import { WorkstationArea } from './components/WorkstationArea';
import { StorageAndDecor } from './components/StorageAndDecor';
import { BedAndWindows } from './components/BedAndWindows';
import { RoomLightingAndControls } from './components/RoomLightingAndControls';
import { BalconyEntrance } from './components/BalconyEntrance';

interface RoomSceneProps {
  activePreset: CameraPreset['id'];
  presetTrigger: number;
  roomLightOn: boolean;
  fanRunning: boolean;
  enteredFrom?: 'initial' | 'balcony' | 'hallway';
  roomGroupRef: React.RefObject<THREE.Group | null>;
  onEnterBalcony: () => void;
  onEnterHallway: () => void;
  onTransitionChange: (visible: boolean, label?: string) => void;
  onPreloadBalcony: () => void;
  onPreloadHallway: () => void;
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
            <h2 className="text-xl font-semibold">3D Viewport Unavailable</h2>
            <p className="text-sm text-zinc-400">
              WebGL could not initialize on this device. Please refresh or enable hardware
              acceleration to explore the 3D room.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RoomWorld({
  roomGroupRef,
  fanRunning,
  balconyDoorOpen,
  hallwayDoorOpen,
  isTransitioning,
  onGoToBalcony,
  onGoToHallway,
  onPreloadBalcony,
  onPreloadHallway,
}: {
  roomGroupRef: React.RefObject<THREE.Group | null>;
  fanRunning: boolean;
  balconyDoorOpen: boolean;
  hallwayDoorOpen: boolean;
  isTransitioning: boolean;
  onGoToBalcony: () => void;
  onGoToHallway: () => void;
  onPreloadBalcony: () => void;
  onPreloadHallway: () => void;
}) {
  const textures = useMemo(() => createRoomTextures(8), []);

  useEffect(() => {
    return () => {
      textures.dispose();
    };
  }, [textures]);

  const halfD = ROOM_DIMENSIONS.depth / 2;

  return (
    <group ref={roomGroupRef} name="PersonalRoomEnvironment">
      <RoomArchitecture
        textures={textures}
        fanRunning={fanRunning}
        balconyDoorOpen={balconyDoorOpen}
        hallwayDoorOpen={hallwayDoorOpen}
      />
      <WorkstationArea textures={textures} />
      <StorageAndDecor textures={textures} />
      <BedAndWindows textures={textures} />

      {/* 3D Interactive Portal Plaque mounted directly on the Back-Left Balcony Door (#1) */}
      <BalconyEntrance
        position={[-1.36, 1.28, halfD - 0.06]}
        rotationY={Math.PI}
        label={balconyDoorOpen ? 'Stepping Out...' : 'GO TO BALCONY'}
        icon="door"
        accent="purple"
        disabled={isTransitioning}
        onActivate={onGoToBalcony}
        onPreload={onPreloadBalcony}
      />

      {/* 3D Interactive Portal Plaque mounted on the Front-Left Hallway Door (#2 near PC casing) */}
      <BalconyEntrance
        position={[-1.44, 1.28, -halfD + 0.07]}
        rotationY={0}
        label={hallwayDoorOpen ? 'Entering Hallway...' : 'GO TO HALLWAY'}
        icon="door"
        accent="emerald"
        disabled={isTransitioning}
        onActivate={onGoToHallway}
        onPreload={onPreloadHallway}
      />
    </group>
  );
}

export default function RoomScene({
  activePreset,
  presetTrigger,
  roomLightOn,
  fanRunning,
  enteredFrom = 'initial',
  roomGroupRef,
  onEnterBalcony,
  onEnterHallway,
  onTransitionChange,
  onPreloadBalcony,
  onPreloadHallway,
}: RoomSceneProps) {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const [contextLost, setContextLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [balconyDoorOpen, setBalconyDoorOpen] = useState(false);
  const [hallwayDoorOpen, setHallwayDoorOpen] = useState(false);
  const [scriptedGlide, setScriptedGlide] = useState<{
    position: [number, number, number];
    target: [number, number, number];
  } | null>(null);

  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);
  const preloadedBalconyRef = useRef(false);
  const preloadedHallwayRef = useRef(false);
  const transitionLockRef = useRef(false);
  const timersRef = useRef<number[]>([]);

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
    const onRestored = () => {
      setContextLost(false);
    };
    el.addEventListener('webglcontextlost', onLost);
    el.addEventListener('webglcontextrestored', onRestored);
    return () => {
      el.removeEventListener('webglcontextlost', onLost);
      el.removeEventListener('webglcontextrestored', onRestored);
    };
  }, []);

  const handleGoToBalcony = useCallback(() => {
    if (transitionLockRef.current || balconyDoorOpen || hallwayDoorOpen) return;
    transitionLockRef.current = true;
    onPreloadBalcony();
    setBalconyDoorOpen(true);

    if (reducedMotion) {
      onTransitionChange(true, 'Stepping onto Balcony');
      const t = window.setTimeout(() => {
        onEnterBalcony();
      }, 280);
      timersRef.current.push(t);
      return;
    }

    setScriptedGlide({
      position: [-1.34, 1.32, 1.44],
      target: [-1.36, 1.24, 2.68],
    });

    const t1 = window.setTimeout(() => {
      onTransitionChange(true, 'Stepping onto Balcony');
    }, 420);

    const t2 = window.setTimeout(() => {
      onEnterBalcony();
    }, 920);

    timersRef.current.push(t1, t2);
  }, [balconyDoorOpen, hallwayDoorOpen, onEnterBalcony, onPreloadBalcony, onTransitionChange, reducedMotion]);

  const handleGoToHallway = useCallback(() => {
    if (transitionLockRef.current || balconyDoorOpen || hallwayDoorOpen) return;
    transitionLockRef.current = true;
    onPreloadHallway();
    setHallwayDoorOpen(true);

    if (reducedMotion) {
      onTransitionChange(true, 'Entering Main Hallway');
      const t = window.setTimeout(() => {
        onEnterHallway();
      }, 280);
      timersRef.current.push(t);
      return;
    }

    setScriptedGlide({
      position: [-1.42, 1.32, -1.24],
      target: [-1.44, 1.24, -2.55],
    });

    const t1 = window.setTimeout(() => {
      onTransitionChange(true, 'Entering Main Hallway');
    }, 420);

    const t2 = window.setTimeout(() => {
      onEnterHallway();
    }, 920);

    timersRef.current.push(t1, t2);
  }, [balconyDoorOpen, hallwayDoorOpen, onEnterHallway, onPreloadHallway, onTransitionChange, reducedMotion]);

  const handleCameraApproach = useCallback(
    (pos: THREE.Vector3) => {
      if (!preloadedBalconyRef.current && pos.x < -0.5 && pos.z > 0.45) {
        preloadedBalconyRef.current = true;
        onPreloadBalcony();
      }
      if (!preloadedHallwayRef.current && pos.x < -0.5 && pos.z < -0.45) {
        preloadedHallwayRef.current = true;
        onPreloadHallway();
      }
    },
    [onPreloadBalcony, onPreloadHallway],
  );

  const initialPreset = CAMERA_PRESETS.overview;
  const startCameraPos: [number, number, number] =
    enteredFrom === 'balcony'
      ? [-1.22, 1.38, 1.38]
      : enteredFrom === 'hallway'
        ? [-1.24, 1.38, -1.24]
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
            fov: 62,
            near: 0.08,
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
          <color attach="background" args={['#0d1813']} />
          <RoomWorld
            roomGroupRef={roomGroupRef}
            fanRunning={fanRunning && !reducedMotion}
            balconyDoorOpen={balconyDoorOpen}
            hallwayDoorOpen={hallwayDoorOpen}
            isTransitioning={balconyDoorOpen || hallwayDoorOpen}
            onGoToBalcony={handleGoToBalcony}
            onGoToHallway={handleGoToHallway}
            onPreloadBalcony={onPreloadBalcony}
            onPreloadHallway={onPreloadHallway}
          />
          <RoomLightingAndControls
            activePreset={activePreset}
            presetTrigger={presetTrigger}
            roomLightOn={roomLightOn}
            isSoftwareGl={isSoftwareGl}
            reducedMotion={reducedMotion}
            scriptedGlide={scriptedGlide}
            onCameraApproach={handleCameraApproach}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
