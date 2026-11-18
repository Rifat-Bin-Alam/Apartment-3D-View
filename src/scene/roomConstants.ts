export const ROOM_DIMENSIONS = {
  width: 3.8, // X: -1.9 to +1.9
  depth: 3.6, // Z: -1.8 to +1.8
  height: 2.85, // Y: 0.0 to 2.85
  wallThickness: 0.14,
  pillarSize: 0.22,
  beamHeight: 0.33,
  baseboardHeight: 0.16,
} as const;

export const ROOM_BOUNDS = {
  minX: -ROOM_DIMENSIONS.width / 2,
  maxX: ROOM_DIMENSIONS.width / 2,
  minY: 0,
  maxY: ROOM_DIMENSIONS.height,
  minZ: -ROOM_DIMENSIONS.depth / 2,
  maxZ: ROOM_DIMENSIONS.depth / 2,
} as const;

export interface CameraPreset {
  id: 'overview' | 'front' | 'left' | 'right' | 'back' | 'desk';
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<CameraPreset['id'], CameraPreset> = {
  overview: {
    id: 'overview',
    label: 'Overview',
    position: [-0.88, 1.42, 0.92],
    target: [0.0, 1.22, -0.04],
  },
  front: {
    id: 'front',
    label: 'Front',
    position: [0.0, 1.36, 1.12],
    target: [0.04, 1.18, -0.1],
  },
  left: {
    id: 'left',
    label: 'Left',
    position: [1.14, 1.38, 0.0],
    target: [-0.15, 1.24, 0.0],
  },
  right: {
    id: 'right',
    label: 'Right',
    position: [-1.14, 1.38, 0.0],
    target: [0.15, 1.24, 0.0],
  },
  back: {
    id: 'back',
    label: 'Back',
    position: [0.0, 1.38, -1.12],
    target: [0.0, 1.22, 0.12],
  },
  desk: {
    id: 'desk',
    label: 'Desk',
    position: [0.18, 1.18, -0.25],
    target: [0.16, 0.98, -1.28],
  },
};

export interface CollisionBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Tight, accurate axis-aligned bounding boxes matching actual 3D room meshes
 * so users can orbit 360 degrees freely at comfortable room height without
 * snagging on invisible volumes while still preventing wall/furniture clipping.
 */
export const FURNITURE_COLLIDERS: CollisionBox[] = [
  // Bed base + mattress (back-right corner)
  { minX: -0.14, maxX: 1.9, minY: 0, maxY: 0.64, minZ: 0.24, maxZ: 1.8 },
  // Bed headboard
  { minX: 1.66, maxX: 1.9, minY: 0, maxY: 1.32, minZ: 0.24, maxZ: 1.8 },
  // Computer desk tabletop & lower pedestals (open air above y=0.77)
  { minX: -0.36, maxX: 0.8, minY: 0, maxY: 0.77, minZ: -1.75, maxZ: -1.12 },
  // Dual monitors sitting near the back of the desk
  { minX: -0.26, maxX: 0.82, minY: 0.76, maxY: 1.18, minZ: -1.78, maxZ: -1.4 },
  // PC tower & stool
  { minX: -0.75, maxX: -0.37, minY: 0, maxY: 0.86, minZ: -1.7, maxZ: -1.22 },
  // Pink/cream 4-tier drawer cabinet
  { minX: 0.9, maxX: 1.6, minY: 0, maxY: 1.16, minZ: -1.76, maxZ: -1.28 },
  // Desk chair
  { minX: -0.12, maxX: 0.44, minY: 0, maxY: 0.9, minZ: -1.08, maxZ: -0.62 },
  // Right wall wooden side chair
  { minX: 1.3, maxX: 1.88, minY: 0, maxY: 0.9, minZ: -0.62, maxZ: -0.06 },
  // Left wall upper concrete loft shelf + boxes
  { minX: -1.9, maxX: -1.32, minY: 2.02, maxY: 2.7, minZ: -1.8, maxZ: 1.8 },
  // Front-left structural pillar
  { minX: -1.02, maxX: -0.76, minY: 0, maxY: 2.85, minZ: -1.8, maxZ: -1.56 },
];
