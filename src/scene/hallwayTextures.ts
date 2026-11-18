import * as THREE from 'three';

export interface HallwayTextureSet {
  wallAlbedo: THREE.CanvasTexture;
  wallBump: THREE.CanvasTexture;
  floorRedAlbedo: THREE.CanvasTexture;
  floorDarkAlbedo: THREE.CanvasTexture;
  floorBump: THREE.CanvasTexture;
  fridgeDoor: THREE.CanvasTexture;
  curtainFloral: THREE.CanvasTexture;
  tableClothFloral: THREE.CanvasTexture;
  chairRoseCover: THREE.CanvasTexture;
  teakWood: THREE.CanvasTexture;
  calendar2025: THREE.CanvasTexture;
  leafSpray: THREE.CanvasTexture;
  crotonLeaf: THREE.CanvasTexture;
  dispose: () => void;
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createPlasterWall(anisotropy: number) {
  const albedo = document.createElement('canvas');
  albedo.width = 512;
  albedo.height = 512;
  const ctx = albedo.getContext('2d')!;
  const rand = seededRandom(501);

  ctx.fillStyle = '#4ec481';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 45; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 36 + rand() * 95;
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, i % 2 === 0 ? 'rgba(112, 232, 160, 0.14)' : 'rgba(34, 145, 84, 0.14)');
    g.addColorStop(1, 'rgba(78, 196, 129, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(rand() * 512, rand() * 512, 2, 7 + rand() * 8);
  }

  const bump = document.createElement('canvas');
  bump.width = 256;
  bump.height = 256;
  const bCtx = bump.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) {
    const v = 115 + Math.floor(rand() * 28);
    bCtx.fillStyle = `rgb(${v},${v},${v})`;
    bCtx.fillRect(rand() * 256, rand() * 256, 2, 4);
  }

  const wallAlbedo = new THREE.CanvasTexture(albedo);
  wallAlbedo.wrapS = wallAlbedo.wrapT = THREE.RepeatWrapping;
  wallAlbedo.repeat.set(2, 1.5);
  wallAlbedo.colorSpace = THREE.SRGBColorSpace;
  wallAlbedo.anisotropy = anisotropy;

  const wallBump = new THREE.CanvasTexture(bump);
  wallBump.wrapS = wallBump.wrapT = THREE.RepeatWrapping;
  wallBump.repeat.set(3, 2);

  return { wallAlbedo, wallBump };
}

function createHallwayFloors(anisotropy: number) {
  const buildFloor = (baseHex: string, lightRgba: string, darkRgba: string, seed: number) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    const rand = seededRandom(seed);

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 65; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const r = 28 + rand() * 85;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, i % 2 === 0 ? lightRgba : darkRgba);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
      ctx.fillRect(rand() * 512, rand() * 512, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2.5);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;
    return tex;
  };

  const floorRedAlbedo = buildFloor('#48241d', 'rgba(110, 58, 46, 0.25)', 'rgba(24, 12, 10, 0.28)', 612);
  const floorDarkAlbedo = buildFloor('#1c2023', 'rgba(56, 62, 68, 0.22)', 'rgba(10, 12, 14, 0.3)', 613);

  const b = document.createElement('canvas');
  b.width = 256;
  b.height = 256;
  const bCtx = b.getContext('2d')!;
  const rand = seededRandom(614);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const v = 108 + Math.floor(rand() * 40);
    bCtx.fillStyle = `rgb(${v},${v},${v})`;
    bCtx.fillRect(rand() * 256, rand() * 256, 2, 2);
  }
  const floorBump = new THREE.CanvasTexture(b);
  floorBump.wrapS = floorBump.wrapT = THREE.RepeatWrapping;
  floorBump.repeat.set(3, 3);

  return { floorRedAlbedo, floorDarkAlbedo, floorBump };
}

function createFridgeDoorTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const rand = seededRandom(702);

  // Glossy burgundy/wine maroon glass gradient matching Walton fridge
  const grad = ctx.createLinearGradient(0, 0, 256, 512);
  grad.addColorStop(0, '#5a1b26');
  grad.addColorStop(0.5, '#3b1019');
  grad.addColorStop(1, '#260a10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Soft floral glass bokeh pattern
  for (let i = 0; i < 24; i++) {
    const x = rand() * 256;
    const y = rand() * 512;
    const r = 14 + rand() * 26;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, 'rgba(215, 130, 148, 0.22)');
    g.addColorStop(1, 'rgba(90, 27, 38, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Horizontal freezer split bar & silver handle seam
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 210, 256, 12);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 222, 256, 4);

  // Subtle metallic badge stickers
  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
  ctx.fillRect(14, 24, 34, 48);
  ctx.beginPath();
  ctx.arc(178, 302, 22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
  ctx.fill();

  ctx.fillStyle = '#d1d5db';
  ctx.font = '700 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WALTON', 128, 492);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createFloralFabric(
  baseHex: string,
  petalHex1: string,
  petalHex2: string,
  seed: number,
  repeatX: number,
  repeatY: number,
  anisotropy: number,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const rand = seededRandom(seed);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 42; i++) {
    const cx = rand() * 512;
    const cy = rand() * 512;
    const radius = 18 + rand() * 26;
    for (let p = 0; p < 7; p++) {
      const a = (p / 7) * Math.PI * 2 + rand() * 0.2;
      ctx.beginPath();
      ctx.ellipse(
        cx + Math.cos(a) * radius * 0.55,
        cy + Math.sin(a) * radius * 0.55,
        radius * 0.48,
        radius * 0.26,
        a,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = p % 2 === 0 ? petalHex1 : petalHex2;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#4a3525';
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createTeakTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const rand = seededRandom(812);

  ctx.fillStyle = '#734424';
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(54, 28, 12, 0.35)' : 'rgba(138, 86, 48, 0.25)';
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    const x = rand() * 256;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (rand() - 0.5) * 14, 170, x + (rand() - 0.5) * 14, 340, x, 512);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createCalendarTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 384);
  // Blue hospital photo header
  const grad = ctx.createLinearGradient(0, 0, 0, 150);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = grad;
  ctx.fillRect(10, 12, 236, 132);

  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(28, 56, 200, 64);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(14, 154, 228, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('2025 CALENDAR', 128, 169);

  // Calendar grid lines
  ctx.fillStyle = '#1e293b';
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 7; col++) {
      ctx.fillRect(20 + col * 31, 198 + r * 30, 18, 14);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createPlantSprayTexture(greenTone: boolean, anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const rand = seededRandom(greenTone ? 901 : 902);
  ctx.clearRect(0, 0, 256, 256);

  for (let i = 0; i < 34; i++) {
    const x = 42 + rand() * 172;
    const y = 30 + rand() * 195;
    const a = (rand() - 0.5) * 1.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 + rand() * 9, 20 + rand() * 12, 0, 0, Math.PI * 2);
    if (greenTone) {
      ctx.fillStyle = i % 2 === 0 ? '#1f6a34' : '#2e8b47';
    } else {
      ctx.fillStyle = i % 3 === 0 ? '#b45309' : i % 2 === 0 ? '#991b1b' : '#365314';
    }
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createHallwayTextures(anisotropy = 8): HallwayTextureSet {
  const { wallAlbedo, wallBump } = createPlasterWall(anisotropy);
  const { floorRedAlbedo, floorDarkAlbedo, floorBump } = createHallwayFloors(anisotropy);
  const fridgeDoor = createFridgeDoorTexture(anisotropy);
  const curtainFloral = createFloralFabric('#d8cfc4', '#a84e52', '#738264', 751, 2, 3, anisotropy);
  const tableClothFloral = createFloralFabric('#dfd4c3', '#a66b46', '#615241', 752, 2, 2, anisotropy);
  const chairRoseCover = createFloralFabric('#e2d9cb', '#b59a7a', '#5b4b3c', 753, 1.5, 1.5, anisotropy);
  const teakWood = createTeakTexture(anisotropy);
  const calendar2025 = createCalendarTexture(anisotropy);
  const leafSpray = createPlantSprayTexture(true, anisotropy);
  const crotonLeaf = createPlantSprayTexture(false, anisotropy);

  return {
    wallAlbedo,
    wallBump,
    floorRedAlbedo,
    floorDarkAlbedo,
    floorBump,
    fridgeDoor,
    curtainFloral,
    tableClothFloral,
    chairRoseCover,
    teakWood,
    calendar2025,
    leafSpray,
    crotonLeaf,
    dispose: () => {
      wallAlbedo.dispose();
      wallBump.dispose();
      floorRedAlbedo.dispose();
      floorDarkAlbedo.dispose();
      floorBump.dispose();
      fridgeDoor.dispose();
      curtainFloral.dispose();
      tableClothFloral.dispose();
      chairRoseCover.dispose();
      teakWood.dispose();
      calendar2025.dispose();
      leafSpray.dispose();
      crotonLeaf.dispose();
    },
  };
}
