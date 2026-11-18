import { CollisionBox } from './roomConstants';

export const HALLWAY_DIMENSIONS = {
  width: 4.8, // X: -2.40 to +2.40 (West fridge bay & East dining bay)
  depth: 4.4, // Z: -2.20 to +2.20 (North front wall to South back wall)
  height: 2.88,
  wallThickness: 0.14,
  baseboardHeight: 0.15,
} as const;

export const HALLWAY_BOUNDS = {
  minX: -2.4,
  maxX: 2.4,
  minY: 0,
  maxY: 2.88,
  minZ: -2.2,
  maxZ: 2.2,
} as const;

export type HallwayPresetId = 'overview' | 'front' | 'left' | 'right' | 'back';

export interface HallwayPreset {
  id: HallwayPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const HALLWAY_PRESETS: Record<HallwayPresetId, HallwayPreset> = {
  overview: {
    id: 'overview',
    label: 'Overview',
    position: [0.18, 1.44, 1.56],
    target: [0.05, 1.24, -0.58],
  },
  front: {
    id: 'front',
    label: 'Front',
    position: [-0.08, 1.38, 1.18],
    target: [-0.08, 1.22, -1.1],
  },
  left: {
    id: 'left',
    label: 'Left',
    position: [0.45, 1.38, 0.05],
    target: [-1.45, 1.22, 0.05],
  },
  right: {
    id: 'right',
    label: 'Right',
    position: [-0.45, 1.38, -0.15],
    target: [1.45, 1.22, -0.45],
  },
  back: {
    id: 'back',
    label: 'Back',
    position: [0.88, 1.4, -1.16],
    target: [0.22, 1.26, 1.65],
  },
};

export const HALLWAY_COLLIDERS: CollisionBox[] = [
  // Walton double-door refrigerator (front-left bay)
  { minX: -1.9, maxX: -1.15, minY: 0, maxY: 1.72, minZ: -2.18, maxZ: -1.45 },
  // Floral dining table + chairs cluster (center-right bay, narrower horizontally)
  { minX: -0.1, maxX: 1.44, minY: 0, maxY: 1.05, minZ: -1.42, maxZ: 0.02 },
  // Water purifier & stand (back wall right-of-column)
  { minX: -0.92, maxX: -0.28, minY: 0, maxY: 1.28, minZ: 1.66, maxZ: 2.18 },
  // Washbasin & laundry tub along continuous West wall inside back-right hallway
  { minX: -2.4, maxX: -1.96, minY: 0, maxY: 1.05, minZ: 2.12, maxZ: 2.72 },
];
