import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CAMERA_PRESETS,
  CameraPreset,
  FURNITURE_COLLIDERS,
  ROOM_BOUNDS,
} from '../roomConstants';

interface RoomLightingAndControlsProps {
  activePreset: CameraPreset['id'];
  presetTrigger: number;
  roomLightOn: boolean;
  isSoftwareGl: boolean;
  reducedMotion: boolean;
  scriptedGlide?: {
    position: [number, number, number];
    target: [number, number, number];
  } | null;
  onCameraApproach?: (pos: THREE.Vector3) => void;
}

const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

/**
 * Clamps camera inside room walls and pushes it smoothly out of furniture AABBs
 * so users can never orbit through walls, floor, ceiling, bed, desk, or shelves.
 */
function clampCameraInsideRoom(pos: THREE.Vector3): void {
  const wallMargin = 0.22;
  pos.x = THREE.MathUtils.clamp(
    pos.x,
    ROOM_BOUNDS.minX + wallMargin,
    ROOM_BOUNDS.maxX - wallMargin,
  );
  pos.y = THREE.MathUtils.clamp(pos.y, 0.36, ROOM_BOUNDS.maxY - 0.26);
  pos.z = THREE.MathUtils.clamp(
    pos.z,
    ROOM_BOUNDS.minZ + wallMargin,
    ROOM_BOUNDS.maxZ - wallMargin,
  );

  const pad = 0.11;
  for (let i = 0; i < FURNITURE_COLLIDERS.length; i++) {
    const box = FURNITURE_COLLIDERS[i];
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

export function RoomLightingAndControls({
  activePreset,
  presetTrigger,
  roomLightOn,
  isSoftwareGl,
  reducedMotion,
  scriptedGlide = null,
  onCameraApproach,
}: RoomLightingAndControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const mainPointLightRef = useRef<THREE.PointLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const windowLightRef = useRef<THREE.DirectionalLight>(null);
  const bulbMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const { camera, gl, scene } = useThree();
  const isTransitioningRef = useRef(false);
  const isScriptedRef = useRef(false);
  const didInitTargetRef = useRef(false);

  // Studio PMREM Environment reflection map
  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = roomLightOn ? 0.36 : 0.14;
    pmremGenerator.dispose();

    return () => {
      scene.environment = null;
      envTex.dispose();
    };
  }, [gl, scene]);

  // Initialize OrbitControls target on very first mount so frame 0 faces room cleanly
  useEffect(() => {
    if (!didInitTargetRef.current && controlsRef.current) {
      controlsRef.current.target.set(...CAMERA_PRESETS[activePreset].target);
      controlsRef.current.update();
      didInitTargetRef.current = true;
    }
  }, [activePreset]);

  // Trigger smooth camera preset transition
  useEffect(() => {
    if (scriptedGlide) return;
    const preset = CAMERA_PRESETS[activePreset];
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

  // Trigger scripted balcony doorway glide
  useEffect(() => {
    if (!scriptedGlide) return;
    _desiredPos.set(...scriptedGlide.position);
    _desiredTarget.set(...scriptedGlide.target);
    isScriptedRef.current = true;
    isTransitioningRef.current = true;
  }, [scriptedGlide]);

  // Cancel scripted preset glide immediately when user interacts
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancelTransition = () => {
      if (!isScriptedRef.current) {
        isTransitioningRef.current = false;
      }
    };
    controls.addEventListener('start', cancelTransition);
    return () => {
      controls.removeEventListener('start', cancelTransition);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current;
    const delta = Math.min(rawDelta, 0.05);

    // Smoothly transition Room Lights ON/OFF
    const lightLerp = reducedMotion ? 60 : 5.2;
    if (mainPointLightRef.current) {
      mainPointLightRef.current.intensity = THREE.MathUtils.damp(
        mainPointLightRef.current.intensity,
        roomLightOn ? 13.5 : 0.32,
        lightLerp,
        delta,
      );
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = THREE.MathUtils.damp(
        hemiLightRef.current.intensity,
        roomLightOn ? 0.65 : 0.19,
        lightLerp,
        delta,
      );
    }
    if (windowLightRef.current) {
      windowLightRef.current.intensity = THREE.MathUtils.damp(
        windowLightRef.current.intensity,
        roomLightOn ? 0.45 : 0.12,
        lightLerp,
        delta,
      );
    }
    if (bulbMatRef.current) {
      bulbMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        bulbMatRef.current.emissiveIntensity,
        roomLightOn ? 2.2 : 0.04,
        lightLerp,
        delta,
      );
    }
    scene.environmentIntensity = THREE.MathUtils.damp(
      scene.environmentIntensity,
      roomLightOn ? 0.36 : 0.15,
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
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -1.25, 1.25);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.45, 2.05);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -1.3, 1.15);
    }

    controls.update();
    if (!isScriptedRef.current) {
      clampCameraInsideRoom(camera.position);
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
        minDistance={0.48}
        maxDistance={2.28}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI * 0.78}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      {/* Emerald wall bounce & ceiling hemisphere fill */}
      <hemisphereLight
        ref={hemiLightRef}
        args={['#d8eee2', '#17251e', roomLightOn ? 0.65 : 0.19]}
      />

      {/* Front Wall Bright LED Bulb Fixture */}
      <group name="WallLEDFixture" position={[0.06, 2.34, ROOM_BOUNDS.minZ + 0.02]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.09, 0.09, 0.025]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshStandardMaterial
            ref={bulbMatRef}
            color="#ffffff"
            emissive="#f8fafc"
            emissiveIntensity={roomLightOn ? 2.2 : 0.04}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Main Room LED PointLight (smoothly toggled via Room Light control) */}
      <pointLight
        ref={mainPointLightRef}
        position={[0.06, 2.28, ROOM_BOUNDS.minZ + 0.24]}
        color="#f8fcff"
        intensity={roomLightOn ? 13.5 : 0.32}
        distance={9}
        decay={1.45}
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0015}
        shadow-normalBias={0.025}
      />

      {/* Soft Window Fill Light */}
      <directionalLight
        ref={windowLightRef}
        position={[1.7, 1.55, 0.95]}
        color="#e9f2ee"
        intensity={roomLightOn ? 0.45 : 0.12}
      />

      {/* Monitor Screen & Desk Ambient Glow (remains active when Room Light is OFF) */}
      <pointLight
        position={[0.18, 1.05, -1.12]}
        color="#7c8dff"
        intensity={0.78}
        distance={2.8}
        decay={1.7}
      />
    </>
  );
}
