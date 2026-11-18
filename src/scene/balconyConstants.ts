import { CollisionBox } from './roomConstants';

export const BALCONY_DIMENSIONS = {
  width: 4.75, // X: -1.90 to +2.85 (much longer balcony corridor extending far along +X)
  depth: 1.28, // Z: +1.94 to +3.22 (~4.2 ft narrow walkable width between shutter wall & front parapet)
  height: 2.85, // Y: 0.0 to 2.85
  wallThickness: 0.14,
  parapetHeight: 0.72,
  grilleTopY: 2.18,
} as const;

export const BALCONY_BOUNDS = {
  minX: -1.9,
  maxX: 2.85,
  minY: 0,
  maxY: 2.85,
  minZ: 1.94, // Flush against exterior face of bedroom Back Wall (1.80 + 0.14)
  maxZ: 3.22,
} as const;

export type BalconyPresetId = 'overview' | 'front' | 'right' | 'back' | 'left';

export interface BalconyPreset {
  id: BalconyPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const BALCONY_PRESETS: Record<BalconyPresetId, BalconyPreset> = {
  overview: {
    id: 'overview',
    label: 'Overview',
    position: [-1.24, 1.42, 2.52],
    target: [0.35, 1.32, 2.66],
  },
  front: {
    id: 'front',
    label: 'Front',
    position: [0.25, 1.38, 2.26],
    target: [0.25, 1.32, 2.95],
  },
  right: {
    id: 'right',
    label: 'Right',
    position: [-1.18, 1.42, 2.58],
    target: [1.55, 1.34, 2.6],
  },
  back: {
    id: 'back',
    label: 'Back',
    position: [-1.34, 1.38, 2.86],
    target: [-1.24, 1.26, 2.12],
  },
  left: {
    id: 'left',
    label: 'Left Wall',
    position: [-0.88, 1.4, 2.58],
    target: [-1.62, 1.32, 2.58],
  },
};

export const BALCONY_COLLIDERS: CollisionBox[] = [
  // Potted mango & greenery row along bedroom exterior wall
  { minX: -0.52, maxX: 2.15, minY: 0, maxY: 0.92, minZ: 1.96, maxZ: 2.34 },
  // Parapet concrete wall base along Front (+Z)
  { minX: -1.9, maxX: 2.85, minY: 0, maxY: 0.78, minZ: 3.02, maxZ: 3.22 },
];
