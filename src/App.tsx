import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CameraPreset } from './scene/roomConstants';
import { BalconyPresetId } from './scene/balconyConstants';
import { HallwayPresetId } from './scene/hallwayConstants';
import { exportRoomToGLB } from './scene/exportGlb';
import { ActiveArea } from './components/BalconyNavigation';
import { RoomTransition } from './components/RoomTransition';
import { PortfolioOverlay, UnifiedPresetId } from './components/PortfolioOverlay';
import { PortfolioFooter } from './components/PortfolioFooter';

const loadRoomScene = () => import('./scene/RoomScene');
const loadBalconyScene = () => import('./scene/BalconyScene');
const loadHallwayScene = () => import('./scene/MainHallwayScene');

const RoomScene = lazy(loadRoomScene);
const BalconyScene = lazy(loadBalconyScene);
const MainHallwayScene = lazy(loadHallwayScene);

function SceneLoader({ area }: { area: ActiveArea }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#090d14]">
      <div className="space-y-2 text-center">
        <p className="font-display text-lg font-medium text-zinc-100">
          {area === 'balcony'
            ? 'Loading 3D Balcony Environment'
            : area === 'hallway'
              ? 'Loading 3D Main Hallway'
              : 'Loading 3D Room Environment'}
        </p>
        <p className="text-xs text-zinc-400">Generating textures and interior lighting...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeArea, setActiveArea] = useState<ActiveArea>('room');
  const [roomEnteredFrom, setRoomEnteredFrom] = useState<'initial' | 'balcony' | 'hallway'>('initial');
  const [enteredViaDoor, setEnteredViaDoor] = useState(false);
  const [exploreMode, setExploreMode] = useState(false);
  const [activePreset, setActivePreset] = useState<UnifiedPresetId>('overview');
  const [presetTrigger, setPresetTrigger] = useState(0);
  const [roomLightOn, setRoomLightOn] = useState(true);
  const [fanRunning, setFanRunning] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [transitionState, setTransitionState] = useState<{
    visible: boolean;
    label?: string;
  }>({ visible: false });

  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const transitionTimersRef = useRef<number[]>([]);

  const clearTransitionTimers = useCallback(() => {
    transitionTimersRef.current.forEach((id) => window.clearTimeout(id));
    transitionTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
    };
  }, [clearTransitionTimers]);

  const preloadArea = useCallback((area: ActiveArea) => {
    if (area === 'room') void loadRoomScene();
    else if (area === 'balcony') void loadBalconyScene();
    else void loadHallwayScene();
  }, []);

  const switchArea = useCallback(
    (
      nextArea: ActiveArea,
      nextPreset: UnifiedPresetId = 'overview',
      viaDoor = false,
      fromArea?: ActiveArea,
    ) => {
      preloadArea(nextArea);
      if (nextArea === 'room') {
        setRoomEnteredFrom(
          fromArea === 'balcony' ? 'balcony' : fromArea === 'hallway' ? 'hallway' : 'initial',
        );
      }
      setEnteredViaDoor(viaDoor);
      setActiveArea(nextArea);
      setActivePreset(nextPreset);
      setPresetTrigger((n) => n + 1);
    },
    [preloadArea],
  );

  const completeDoorTransition = useCallback(
    (nextArea: ActiveArea, fromArea: ActiveArea) => {
      clearTransitionTimers();
      switchArea(nextArea, 'overview', true, fromArea);
      const revealTimer = window.setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, visible: false }));
      }, 280);
      transitionTimersRef.current.push(revealTimer);
    },
    [clearTransitionTimers, switchArea],
  );

  const triggerPreset = useCallback(
    (preset: UnifiedPresetId) => {
      if (preset === 'desk' && activeArea !== 'room') {
        switchArea('room', 'desk', false);
        return;
      }
      setActivePreset(preset);
      setPresetTrigger((n) => n + 1);
    },
    [activeArea, switchArea],
  );

  const handleResetCamera = useCallback(() => {
    triggerPreset('overview');
  }, [triggerPreset]);

  const handleTransitionChange = useCallback((visible: boolean, label?: string) => {
    setTransitionState({ visible, label });
  }, []);

  const handleDirectAreaSelect = useCallback(
    (area: ActiveArea) => {
      if (area === activeArea || transitionState.visible) return;
      const previousArea = activeArea;
      clearTransitionTimers();
      preloadArea(area);
      setTransitionState({
        visible: true,
        label:
          area === 'balcony'
            ? 'Stepping onto Balcony'
            : area === 'hallway'
              ? 'Entering Main Hallway'
              : 'Returning to Bedroom',
      });
      const swapTimer = window.setTimeout(() => {
        switchArea(area, 'overview', true, previousArea);
      }, 480);
      const revealTimer = window.setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, visible: false }));
      }, 760);
      transitionTimersRef.current.push(swapTimer, revealTimer);
    },
    [activeArea, clearTransitionTimers, preloadArea, switchArea, transitionState.visible],
  );

  const handleExportGlb = useCallback(async () => {
    if (!sceneGroupRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const filename =
        activeArea === 'balcony'
          ? 'balcony-3d.glb'
          : activeArea === 'hallway'
            ? 'main-hallway-3d.glb'
            : 'my-room-3d.glb';
      await exportRoomToGLB(sceneGroupRef.current, filename);
    } catch (err) {
      console.error('GLB export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [activeArea, isExporting]);

  const roomPreset: CameraPreset['id'] =
    activePreset === 'desk' ||
    activePreset === 'overview' ||
    activePreset === 'front' ||
    activePreset === 'left' ||
    activePreset === 'right' ||
    activePreset === 'back'
      ? activePreset
      : 'overview';

  const balconyPreset: BalconyPresetId =
    activePreset === 'overview' ||
    activePreset === 'front' ||
    activePreset === 'right' ||
    activePreset === 'back' ||
    activePreset === 'left'
      ? activePreset
      : 'overview';

  const hallwayPreset: HallwayPresetId =
    activePreset === 'overview' ||
    activePreset === 'front' ||
    activePreset === 'left' ||
    activePreset === 'right' ||
    activePreset === 'back'
      ? activePreset
      : 'overview';

  return (
    <div className="min-h-screen w-full bg-[#080a10]">
      {/* Full-Screen Interactive 3D Room, Main Hallway & Balcony Stage */}
      <main
        id="room-stage"
        className="relative h-screen w-full overflow-hidden bg-[#0b1310]"
      >
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<SceneLoader area={activeArea} />}>
            {activeArea === 'room' ? (
              <RoomScene
                activePreset={roomPreset}
                presetTrigger={presetTrigger}
                roomLightOn={roomLightOn}
                fanRunning={fanRunning}
                enteredFrom={roomEnteredFrom}
                roomGroupRef={sceneGroupRef}
                onEnterBalcony={() => completeDoorTransition('balcony', 'room')}
                onEnterHallway={() => completeDoorTransition('hallway', 'room')}
                onTransitionChange={handleTransitionChange}
                onPreloadBalcony={() => preloadArea('balcony')}
                onPreloadHallway={() => preloadArea('hallway')}
              />
            ) : activeArea === 'hallway' ? (
              <MainHallwayScene
                activePreset={hallwayPreset}
                presetTrigger={presetTrigger}
                roomLightOn={roomLightOn}
                fanRunning={fanRunning}
                enteredFromRoom={enteredViaDoor}
                hallwayGroupRef={sceneGroupRef}
                onReturnToBedroom={() => completeDoorTransition('room', 'hallway')}
                onTransitionChange={handleTransitionChange}
                onPreloadBedroom={() => preloadArea('room')}
              />
            ) : (
              <BalconyScene
                activePreset={balconyPreset}
                presetTrigger={presetTrigger}
                roomLightOn={roomLightOn}
                enteredFromRoom={enteredViaDoor}
                balconyGroupRef={sceneGroupRef}
                onReturnToBedroom={() => completeDoorTransition('room', 'balcony')}
                onTransitionChange={handleTransitionChange}
                onPreloadBedroom={() => preloadArea('room')}
              />
            )}
          </Suspense>
        </div>

        <RoomTransition visible={transitionState.visible} label={transitionState.label} />

        <PortfolioOverlay
          activeArea={activeArea}
          onSelectArea={handleDirectAreaSelect}
          onPreloadArea={preloadArea}
          exploreMode={exploreMode}
          onToggleExploreMode={() => setExploreMode((v) => !v)}
          activePreset={activePreset}
          onSelectPreset={triggerPreset}
          onResetCamera={handleResetCamera}
          roomLightOn={roomLightOn}
          onToggleRoomLight={() => setRoomLightOn((v) => !v)}
          fanRunning={fanRunning}
          onToggleFan={() => setFanRunning((v) => !v)}
          onExportGlb={handleExportGlb}
          isExporting={isExporting}
        />
      </main>

      {/* Professional Portfolio Footer below the 3D Room */}
      <PortfolioFooter />
    </div>
  );
}
