import * as THREE from 'three';

export interface BalconyTextureSet {
  wallAlbedo: THREE.CanvasTexture;
  wallBump: THREE.CanvasTexture;
  parapetWeathered: THREE.CanvasTexture;
  floorConcrete: THREE.CanvasTexture;
  floorBump: THREE.CanvasTexture;
  woodShutter: THREE.CanvasTexture;
  teakWood: THREE.CanvasTexture;
  twilightSky: THREE.CanvasTexture;
  mangoLeaf: THREE.CanvasTexture;
  bedFloral: THREE.CanvasTexture;
  dispose: () => void;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function createBalconyWallTextures(anisotropy: number) {
  const size = 512;
  const [c1, ctx1] = makeCanvas(size, size);
  const [c2, ctx2] = makeCanvas(size, size);
  const rand = seededRandom(510);

  ctx1.fillStyle = '#43b370';
  ctx1.fillRect(0, 0, size, size);
  ctx2.fillStyle = '#808080';
  ctx2.fillRect(0, 0, size, size);

  for (let i = 0; i < 3600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 14;
    const delta = (rand() - 0.5) * 20;
    const g = Math.max(140, Math.min(206, Math.round(179 + delta)));
    const red = Math.max(46, Math.min(92, Math.round(67 + delta * 0.45)));
    const blue = Math.max(88, Math.min(136, Math.round(112 + delta * 0.5)));
    ctx1.fillStyle = `rgba(${red}, ${g}, ${blue}, 0.16)`;
    ctx1.beginPath();
    ctx1.arc(x, y, r, 0, Math.PI * 2);
    ctx1.fill();

    const bv = Math.round(128 + delta * 1.4);
    ctx2.fillStyle = `rgba(${bv}, ${bv}, ${bv}, 0.22)`;
    ctx2.beginPath();
    ctx2.arc(x, y, r * 0.7, 0, Math.PI * 2);
    ctx2.fill();
  }

  return {
    albedo: finalizeTexture(c1, true, anisotropy, 2, 2),
    bump: finalizeTexture(c2, false, anisotropy, 2, 2),
  };
}

function createWeatheredParapetTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  const rand = seededRandom(520);

  ctx.fillStyle = '#3ea165';
  ctx.fillRect(0, 0, size, size);

  // Weathered cement & peeling paint patches along upper parapet ledge
  for (let i = 0; i < 160; i++) {
    const x = rand() * size;
    const y = rand() * 110;
    ctx.fillStyle = rand() > 0.4 ? 'rgba(130, 146, 134, 0.5)' : 'rgba(65, 82, 70, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 8 + rand() * 24, 5 + rand() * 14, rand(), 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle vertical rain streaks down exterior concrete wall
  for (let i = 0; i < 220; i++) {
    const x = rand() * size;
    const y = 30 + rand() * 200;
    const h = 40 + rand() * 180;
    ctx.fillStyle = 'rgba(22, 44, 30, 0.12)';
    ctx.fillRect(x, y, 2 + rand() * 5, h);
  }

  return finalizeTexture(canvas, true, anisotropy, 2, 1);
}

function createBalconyFloorTextures(anisotropy: number) {
  const size = 512;
  const [c1, ctx1] = makeCanvas(size, size);
  const [c2, ctx2] = makeCanvas(size, size);
  const rand = seededRandom(530);

  ctx1.fillStyle = '#202422';
  ctx1.fillRect(0, 0, size, size);
  ctx2.fillStyle = '#808080';
  ctx2.fillRect(0, 0, size, size);

  // Exterior damp weathered concrete patches & subtle moss tones
  for (let i = 0; i < 260; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 16 + rand() * 54;
    const shade = rand();
    ctx1.fillStyle =
      shade > 0.65
        ? 'rgba(54, 60, 56, 0.2)'
        : shade > 0.3
          ? 'rgba(20, 26, 22, 0.26)'
          : 'rgba(40, 54, 40, 0.16)';
    ctx1.beginPath();
    ctx1.arc(x, y, r, 0, Math.PI * 2);
    ctx1.fill();

    const bv = shade > 0.5 ? 148 : 108;
    ctx2.fillStyle = `rgba(${bv}, ${bv}, ${bv}, 0.2)`;
    ctx2.beginPath();
    ctx2.arc(x, y, r * 0.85, 0, Math.PI * 2);
    ctx2.fill();
  }

  return {
    albedo: finalizeTexture(c1, true, anisotropy, 3, 1.5),
    bump: finalizeTexture(c2, false, anisotropy, 3, 1.5),
  };
}

function createShutterTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);
  const rand = seededRandom(540);

  ctx.fillStyle = '#704224';
  ctx.fillRect(0, 0, w, h);

  // Subtle vertical plank seams & wood grain matching balcony left window shutters
  for (let p = 0; p < 8; p++) {
    const px = (p / 8) * w;
    ctx.fillStyle = '#472814';
    ctx.fillRect(px, 0, 5, h);
    ctx.fillStyle = 'rgba(130, 82, 48, 0.35)';
    ctx.fillRect(px + 6, 0, 4, h);
  }
  for (let i = 0; i < 160; i++) {
    const x = rand() * w;
    ctx.strokeStyle = 'rgba(42, 22, 10, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rand() - 0.5) * 10, h);
    ctx.stroke();
  }

  return finalizeTexture(canvas, true, anisotropy);
}

function createTeakWoodTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  const rand = seededRandom(550);
  ctx.fillStyle = '#5c3921';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) {
    const y = rand() * 512;
    ctx.strokeStyle = rand() > 0.45 ? '#3b2212' : '#7a4f30';
    ctx.globalAlpha = 0.14 + rand() * 0.22;
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + 8, 340, y - 8, 512, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finalizeTexture(canvas, true, anisotropy);
}

function createTwilightSkyTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);

  // Dusk twilight sunset sky gradient matching 'balcony front.' photo
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.68);
  sky.addColorStop(0.0, '#161b33');
  sky.addColorStop(0.35, '#2b2548');
  sky.addColorStop(0.68, '#5f355c');
  sky.addColorStop(0.92, '#7d4460');
  sky.addColorStop(1.0, '#3e233b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Dark foreground silhouettes: palm trees + neighboring concrete rooftop building on right
  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, h * 0.64, w, h * 0.36);

  // Neighboring flat-roof building on right side
  ctx.fillRect(w * 0.68, h * 0.45, w * 0.32, h * 0.25);
  ctx.fillRect(w * 0.74, h * 0.38, w * 0.18, h * 0.1);
  // Roof antennae poles
  ctx.fillRect(w * 0.94, h * 0.24, 4, h * 0.22);
  ctx.fillRect(w * 0.81, h * 0.3, 3, h * 0.1);

  // Distant palm silhouettes & tree tops along horizon
  const palms = [0.14, 0.28, 0.44, 0.56, 0.61];
  for (const pxNorm of palms) {
    const px = pxNorm * w;
    const topY = h * (0.48 + (pxNorm * 13) % 0.1);
    ctx.fillRect(px - 2, topY, 4, h * 0.2);
    for (let f = 0; f < 6; f++) {
      const a = (f / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(px, topY);
      ctx.lineTo(px + Math.cos(a) * 26, topY + Math.sin(a) * 14 + 6);
      ctx.lineTo(px + Math.cos(a + 0.3) * 12, topY + Math.sin(a + 0.3) * 8);
      ctx.fill();
    }
  }

  return finalizeTexture(canvas, true, anisotropy);
}

function createMangoLeafTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRandom(560);
  ctx.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + rand() * 0.3;
    const len = 68 + rand() * 44;
    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(a);
    ctx.fillStyle = i % 3 === 0 ? '#3f7d2c' : i % 2 === 0 ? '#2f6122' : '#539434';
    ctx.beginPath();
    ctx.ellipse(len * 0.5, 0, len * 0.48, 14 + rand() * 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return finalizeTexture(canvas, true, anisotropy);
}

function createBedFloralTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const rand = seededRandom(570);
  ctx.fillStyle = '#b92b36';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = '#f4efe2';
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 8 + rand() * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  return finalizeTexture(canvas, true, anisotropy, 2, 2);
}

export function createBalconyTextures(maxAnisotropy = 4): BalconyTextureSet {
  const aniso = Math.min(maxAnisotropy, 8);
  const wall = createBalconyWallTextures(aniso);
  const parapetWeathered = createWeatheredParapetTexture(aniso);
  const floor = createBalconyFloorTextures(aniso);
  const woodShutter = createShutterTexture(aniso);
  const teakWood = createTeakWoodTexture(aniso);
  const twilightSky = createTwilightSkyTexture(aniso);
  const mangoLeaf = createMangoLeafTexture(aniso);
  const bedFloral = createBedFloralTexture(aniso);

  const all: THREE.Texture[] = [
    wall.albedo,
    wall.bump,
    parapetWeathered,
    floor.albedo,
    floor.bump,
    woodShutter,
    teakWood,
    twilightSky,
    mangoLeaf,
    bedFloral,
  ];

  return {
    wallAlbedo: wall.albedo,
    wallBump: wall.bump,
    parapetWeathered,
    floorConcrete: floor.albedo,
    floorBump: floor.bump,
    woodShutter,
    teakWood,
    twilightSky,
    mangoLeaf,
    bedFloral,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
