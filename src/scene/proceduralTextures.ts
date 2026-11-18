import * as THREE from 'three';

export interface RoomTextureSet {
  wallAlbedo: THREE.CanvasTexture;
  wallBump: THREE.CanvasTexture;
  floorAlbedo: THREE.CanvasTexture;
  floorBump: THREE.CanvasTexture;
  teakWood: THREE.CanvasTexture;
  oakWood: THREE.CanvasTexture;
  curtainFloral: THREE.CanvasTexture;
  bedFloral: THREE.CanvasTexture;
  drawerFloral: THREE.CanvasTexture;
  calligraphyPanels: THREE.CanvasTexture[];
  monitorLeft: THREE.CanvasTexture;
  monitorRight: THREE.CanvasTexture;
  pureitBox: THREE.CanvasTexture;
  cardboard: THREE.CanvasTexture;
  chairCoverFloral: THREE.CanvasTexture;
  prayerCloth: THREE.CanvasTexture;
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

function createWallTextures(anisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [c1, ctx1] = makeCanvas(size, size);
  const [c2, ctx2] = makeCanvas(size, size);
  const rand = seededRandom(101);

  // Base mint-emerald plaster paint matching the photographs
  ctx1.fillStyle = '#43b370';
  ctx1.fillRect(0, 0, size, size);

  ctx2.fillStyle = '#808080';
  ctx2.fillRect(0, 0, size, size);

  // Subtle roller texture + organic plaster mottling
  for (let i = 0; i < 4200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 14;
    const delta = (rand() - 0.5) * 18;
    const g = Math.max(145, Math.min(205, Math.round(179 + delta)));
    const red = Math.max(48, Math.min(92, Math.round(67 + delta * 0.45)));
    const blue = Math.max(90, Math.min(136, Math.round(112 + delta * 0.5)));
    ctx1.fillStyle = `rgba(${red}, ${g}, ${blue}, 0.16)`;
    ctx1.beginPath();
    ctx1.arc(x, y, r, 0, Math.PI * 2);
    ctx1.fill();

    const bVal = Math.round(128 + delta * 1.4);
    ctx2.fillStyle = `rgba(${bVal}, ${bVal}, ${bVal}, 0.22)`;
    ctx2.beginPath();
    ctx2.arc(x, y, r * 0.7, 0, Math.PI * 2);
    ctx2.fill();
  }

  // Subtle vertical scuff marks near lower walls
  for (let i = 0; i < 180; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const h = 4 + rand() * 18;
    ctx1.fillStyle = 'rgba(28, 78, 52, 0.08)';
    ctx1.fillRect(x, y, 1.5, h);
  }

  return {
    albedo: finalizeTexture(c1, true, anisotropy, 2, 2),
    bump: finalizeTexture(c2, false, anisotropy, 2, 2),
  };
}

function createFloorTextures(anisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  const [bCanvas, bCtx] = makeCanvas(size, size);
  const rand = seededRandom(202);

  // Solid dark charcoal matte concrete base (no marble veins, no tile seams)
  ctx.fillStyle = '#1b1d20';
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Subtle trowel tonal clouds so concrete is rich and natural, never flat black
  for (let i = 0; i < 240; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 18 + rand() * 58;
    const v = rand() > 0.5 ? 36 : 20;
    ctx.fillStyle = `rgba(${v}, ${v + 2}, ${v + 4}, 0.12)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const bv = rand() > 0.5 ? 142 : 114;
    bCtx.fillStyle = `rgba(${bv}, ${bv}, ${bv}, 0.14)`;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.85, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Fine mineral concrete grain & tiny micro-pores
  for (let i = 0; i < 6500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.6 + rand() * 2.1;
    const tone = rand();
    ctx.fillStyle =
      tone > 0.65
        ? 'rgba(54, 57, 62, 0.24)'
        : tone > 0.3
          ? 'rgba(18, 20, 22, 0.30)'
          : 'rgba(42, 45, 49, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const bv = tone > 0.5 ? 156 : 96;
    bCtx.fillStyle = `rgba(${bv}, ${bv}, ${bv}, 0.25)`;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  return {
    albedo: finalizeTexture(canvas, true, anisotropy, 3, 3),
    bump: finalizeTexture(bCanvas, false, anisotropy, 3, 3),
  };
}

function createWoodTexture(
  baseHex: string,
  grainHex: string,
  highlightHex: string,
  anisotropy: number,
  seed: number,
): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);
  const rand = seededRandom(seed);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 160; i++) {
    const y = rand() * h;
    const thickness = 1 + rand() * 3.5;
    ctx.strokeStyle = rand() > 0.45 ? grainHex : highlightHex;
    ctx.globalAlpha = 0.14 + rand() * 0.22;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(0, y);
    const wave = (rand() - 0.5) * 18;
    ctx.bezierCurveTo(w * 0.33, y + wave, w * 0.66, y - wave, w, y + (rand() - 0.5) * 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return finalizeTexture(canvas, true, anisotropy);
}

function createCurtainTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 1024;
  const [canvas, ctx] = makeCanvas(w, h);
  const rand = seededRandom(303);

  // Vertical gradient matching the garden-print curtains in Photos 3 & 4
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#c7d9ce');
  grad.addColorStop(0.18, '#b6cbbd');
  grad.addColorStop(0.35, '#6c9c77');
  grad.addColorStop(0.62, '#496f4d');
  grad.addColorStop(0.84, '#6d6257');
  grad.addColorStop(1.0, '#2c2f28');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft vertical fabric pleats shading
  for (let x = 0; x < w; x += 48) {
    const pGrad = ctx.createLinearGradient(x, 0, x + 48, 0);
    pGrad.addColorStop(0, 'rgba(0,0,0,0.16)');
    pGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = pGrad;
    ctx.fillRect(x, 0, 48, h);
  }

  // Tall wildflower stems & foliage blades in lower 70%
  for (let i = 0; i < 420; i++) {
    const x = rand() * w;
    const baseY = h * (0.28 + rand() * 0.72);
    const stemH = 60 + rand() * 180;
    ctx.strokeStyle = rand() > 0.4 ? 'rgba(38, 72, 42, 0.55)' : 'rgba(78, 120, 74, 0.48)';
    ctx.lineWidth = 1.2 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + (rand() - 0.5) * 18, baseY - stemH * 0.5, x + (rand() - 0.5) * 12, baseY - stemH);
    ctx.stroke();
  }

  // Dense clusters of white, cream, pale-blue & pink blossoms in mid-band
  for (let i = 0; i < 750; i++) {
    const x = rand() * w;
    const y = h * (0.24 + Math.pow(rand(), 1.15) * 0.56);
    const radius = 2 + rand() * 5.2;
    const pick = rand();
    ctx.fillStyle =
      pick > 0.35
        ? 'rgba(246, 249, 244, 0.88)'
        : pick > 0.14
          ? 'rgba(205, 229, 240, 0.85)'
          : 'rgba(238, 182, 188, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (radius > 4.2) {
      ctx.fillStyle = 'rgba(220, 186, 80, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dark meadow grass at bottom hem
  for (let i = 0; i < 280; i++) {
    const x = rand() * w;
    const y = h - rand() * 190;
    ctx.strokeStyle = 'rgba(24, 30, 22, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + (rand() - 0.5) * 20, y);
    ctx.stroke();
  }

  return finalizeTexture(canvas, true, anisotropy);
}

function drawRoseCluster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  rand: () => number,
) {
  // Sage green leaves around blossom cluster
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + rand() * 0.5;
    const lx = cx + Math.cos(angle) * 24 * scale;
    const ly = cy + Math.sin(angle) * 24 * scale;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.fillStyle = '#9aa878';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Cream-white flower petals
  for (let f = 0; f < 3; f++) {
    const fx = cx + (f - 1) * 16 * scale + (rand() - 0.5) * 10;
    const fy = cy + (rand() - 0.5) * 18 * scale;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.fillStyle = p % 2 === 0 ? '#f4efe2' : '#e8dec5';
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * 8 * scale, fy + Math.sin(a) * 8 * scale, 7.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#c89b4b';
    ctx.beginPath();
    ctx.arc(fx, fy, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function createBedFloralTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  const rand = seededRandom(404);

  // Crimson red cotton base matching Photos 3 & 4
  ctx.fillStyle = '#b92b36';
  ctx.fillRect(0, 0, size, size);

  // Subtle weave texture
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(50,0,10,0.05)';
    ctx.fillRect(rand() * size, rand() * size, 3, 1);
  }

  // Distributed cream-white floral clusters
  const positions = [
    [80, 90],
    [256, 70],
    [420, 110],
    [150, 240],
    [350, 230],
    [70, 390],
    [245, 385],
    [435, 410],
  ];
  for (const [x, y] of positions) {
    drawRoseCluster(ctx, x, y, 0.9 + rand() * 0.3, rand);
  }

  return finalizeTexture(canvas, true, anisotropy, 2, 2);
}

function createDrawerFloralTexture(anisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const [canvas, ctx] = makeCanvas(w, h);

  // Cream / off-white molded plastic panel
  ctx.fillStyle = '#ddd7c5';
  ctx.fillRect(0, 0, w, h);

  // Subtle horizontal plastic sheen
  const sheen = ctx.createLinearGradient(0, 0, 0, h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Delicate black botanical stalks + butterfly decal (Photos 2 & 3)
  const drawStalk = (ox: number, flip: number) => {
    ctx.strokeStyle = '#2d312c';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ox, h);
    ctx.quadraticCurveTo(ox + 26 * flip, h * 0.55, ox + 55 * flip, h * 0.28);
    ctx.stroke();

    // Flower petals
    const fx = ox + 55 * flip;
    const fy = h * 0.28;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(a) * 14, fy + Math.sin(a) * 14, 10, 5, a, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Butterfly nearby
    const bx = ox + 110 * flip;
    const by = h * 0.48;
    ctx.fillStyle = 'rgba(42, 46, 42, 0.72)';
    ctx.beginPath();
    ctx.ellipse(bx - 7, by - 5, 9, 6, -0.4, 0, Math.PI * 2);
    ctx.ellipse(bx + 7, by - 5, 9, 6, 0.4, 0, Math.PI * 2);
    ctx.ellipse(bx - 5, by + 5, 6, 4, 0.4, 0, Math.PI * 2);
    ctx.ellipse(bx + 5, by + 5, 6, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();
  };

  drawStalk(56, 1);
  drawStalk(w - 56, -1);

  return finalizeTexture(canvas, true, anisotropy);
}

function createCalligraphyPanels(anisotropy: number): THREE.CanvasTexture[] {
  const rand = seededRandom(505);
  return [0, 1, 2, 3, 4].map((idx) => {
    const w = 256;
    const h = idx === 2 ? 512 : idx === 1 || idx === 3 ? 420 : 340;
    const [canvas, ctx] = makeCanvas(w, h);

    // Cool silver-blue-gray canvas background matching Photo 2
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#bfc9cf');
    grad.addColorStop(1, '#a9b4bb');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#1b1d1f';
    ctx.fillStyle = '#1b1d1f';

    if (idx === 2) {
      // Center circular calligraphy medallion
      const cx = w / 2;
      const cy = h * 0.56;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 78, 0, Math.PI * 2);
      ctx.stroke();

      // Ornate calligraphic strokes inside circle & vertical top finial
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const r1 = 16 + rand() * 54;
        const r2 = 22 + rand() * 56;
        ctx.lineWidth = 2.5 + rand() * 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.quadraticCurveTo(
          cx + (rand() - 0.5) * 40,
          cy + (rand() - 0.5) * 40,
          cx + Math.cos(a + 0.5) * r2,
          cy + Math.sin(a + 0.5) * r2,
        );
        ctx.stroke();
      }
      // Top vertical strokes
      ctx.lineWidth = 6;
      for (let s = -2; s <= 2; s++) {
        ctx.beginPath();
        ctx.moveTo(cx + s * 16, h * 0.14);
        ctx.lineTo(cx + s * 16, h * 0.36);
        ctx.stroke();
      }
    } else {
      // Flanking vertical calligraphy brush strokes
      for (let i = 0; i < 24; i++) {
        const x = 36 + rand() * (w - 72);
        const y = 36 + rand() * (h - 72);
        ctx.lineWidth = 2 + rand() * 4.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(
          x + (rand() - 0.5) * 50,
          y + (rand() - 0.5) * 40,
          x + (rand() - 0.5) * 50,
          y + 20 + rand() * 50,
          x + (rand() - 0.5) * 35,
          y + 40 + rand() * 50,
        );
        ctx.stroke();
      }
    }

    return finalizeTexture(canvas, true, anisotropy);
  });
}

function createMonitorTextures(anisotropy: number): {
  left: THREE.CanvasTexture;
  right: THREE.CanvasTexture;
  onDispose: () => void;
} {
  // Main monitor (LeftMonitor): User's portfolio website (https://rifat-bin-alam.vercel.app/)
  const w = 1024;
  const h = 586;
  const [cL, ctxL] = makeCanvas(w, h);
  const rand = seededRandom(808);

  // Instant high-res canvas render matching the portfolio website hero + orbital portrait
  ctxL.fillStyle = '#040814';
  ctxL.fillRect(0, 0, w, h);

  // Subtle starry background dots
  for (let i = 0; i < 60; i++) {
    ctxL.fillStyle = i % 5 === 0 ? 'rgba(96, 165, 250, 0.55)' : 'rgba(203, 213, 225, 0.45)';
    ctxL.beginPath();
    ctxL.arc(rand() * w, rand() * h, 1 + rand() * 1.4, 0, Math.PI * 2);
    ctxL.fill();
  }

  // Top nav bar
  ctxL.fillStyle = '#60a5fa';
  ctxL.font = 'bold 14px sans-serif';
  ctxL.fillText('</> Rifat Bin Alam', 190, 42);
  ctxL.fillStyle = '#94a3b8';
  ctxL.font = '11px sans-serif';
  ctxL.fillText('About   Skills   Projects   Education   Research   Contact', 405, 42);

  // Status pill & Hero Title
  ctxL.fillStyle = '#0f172a';
  ctxL.fillRect(190, 160, 128, 20);
  ctxL.fillStyle = '#22c55e';
  ctxL.beginPath();
  ctxL.arc(200, 170, 3, 0, Math.PI * 2);
  ctxL.fill();
  ctxL.fillStyle = '#cbd5e1';
  ctxL.font = '10px sans-serif';
  ctxL.fillText('Looking for opportunities', 210, 173);

  ctxL.fillStyle = '#38bdf8';
  ctxL.font = 'bold 12px monospace';
  ctxL.fillText("HI, I'M", 190, 205);
  ctxL.fillStyle = '#ffffff';
  ctxL.font = 'bold 42px sans-serif';
  ctxL.fillText('Rifat Bin Alam', 190, 248);
  ctxL.fillStyle = '#3b82f6';
  ctxL.font = 'bold 22px sans-serif';
  ctxL.fillText('Backend Developer_', 190, 278);

  // View Projects CTA button
  ctxL.fillStyle = '#2563eb';
  ctxL.fillRect(190, 368, 92, 28);
  ctxL.fillStyle = '#ffffff';
  ctxL.font = 'bold 11px sans-serif';
  ctxL.fillText('View Projects', 200, 386);

  // Orbital rings + portrait circle on right
  const orbX = 720;
  const orbY = 278;
  ctxL.strokeStyle = 'rgba(96, 165, 250, 0.35)';
  ctxL.lineWidth = 2;
  ctxL.beginPath();
  ctxL.arc(orbX, orbY, 108, 0, Math.PI * 2);
  ctxL.stroke();
  ctxL.beginPath();
  ctxL.ellipse(orbX, orbY, 122, 68, -0.35, 0, Math.PI * 2);
  ctxL.stroke();
  ctxL.fillStyle = '#1e293b';
  ctxL.beginPath();
  ctxL.arc(orbX, orbY, 56, 0, Math.PI * 2);
  ctxL.fill();

  const leftTex = finalizeTexture(cL, true, anisotropy);

  // Overlay the exact user portfolio screenshot cleanly preserving aspect ratio
  let disposed = false;
  const img = new Image();
  img.onload = () => {
    if (disposed) return;
    ctxL.fillStyle = '#040814';
    ctxL.fillRect(0, 0, w, h);
    const drawW = w;
    const drawH = (img.height / img.width) * w;
    const offsetY = (h - drawH) / 2;
    ctxL.drawImage(img, 0, offsetY, drawW, drawH);
    leftTex.needsUpdate = true;
  };
  img.src = '/assets/aistudio/image_2f2807fc.png';

  // Right monitor: Vibrant violet-blue abstract wallpaper + terminal window (Photo 2)
  const [cR, ctxR] = makeCanvas(512, 320);
  const bg = ctxR.createLinearGradient(0, 0, 512, 320);
  bg.addColorStop(0, '#3b1d8c');
  bg.addColorStop(0.45, '#5b39d6');
  bg.addColorStop(1, '#1c4ed8');
  ctxR.fillStyle = bg;
  ctxR.fillRect(0, 0, 512, 320);

  // Soft purple glow clouds
  const glow = ctxR.createRadialGradient(256, 160, 20, 256, 160, 220);
  glow.addColorStop(0, 'rgba(196, 140, 255, 0.55)');
  glow.addColorStop(1, 'rgba(50, 20, 120, 0)');
  ctxR.fillStyle = glow;
  ctxR.fillRect(0, 0, 512, 320);

  // Dark code/terminal window overlay
  ctxR.fillStyle = 'rgba(17, 20, 32, 0.92)';
  ctxR.fillRect(88, 54, 246, 178);
  ctxR.fillStyle = '#252b42';
  ctxR.fillRect(88, 54, 246, 20);
  for (let r = 0; r < 11; r++) {
    ctxR.fillStyle = r % 3 === 0 ? '#a78bfa' : r % 2 === 0 ? '#38bdf8' : '#cbd5e1';
    ctxR.fillRect(102, 86 + r * 12, 60 + ((r * 37) % 140), 4);
  }
  ctxR.fillStyle = '#0a0d18';
  ctxR.fillRect(0, 298, 512, 22);

  return {
    left: leftTex,
    right: finalizeTexture(cR, true, anisotropy),
    onDispose: () => {
      disposed = true;
    },
  };
}

function createPureitBoxTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 384);
  // Deep Unilever Pureit blue box with yellow top/bottom accent stripe (Photo 1 & 4)
  ctx.fillStyle = '#0d3d73';
  ctx.fillRect(0, 0, 512, 384);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 356, 512, 28);
  ctx.fillRect(390, 22, 84, 28);

  // White brand badge & purifier graphic
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('pureit', 48, 108);
  ctx.font = 'italic 26px serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Classic', 52, 162);
  ctx.font = '18px sans-serif';
  ctx.fillText('23 Litres', 54, 194);

  // Purifier silhouette on right side of box
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(280, 60, 90, 195);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(292, 155, 66, 86);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(310, 74, 30, 64);

  return finalizeTexture(canvas, true, anisotropy);
}

function createCardboardTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRandom(606);
  ctx.fillStyle = '#a67b56';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(65,42,24,0.12)' : 'rgba(210,175,135,0.1)';
    ctx.fillRect(rand() * 256, rand() * 256, 6 + rand() * 14, 2);
  }
  return finalizeTexture(canvas, true, anisotropy);
}

function createChairCoverTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  const rand = seededRandom(707);
  ctx.fillStyle = '#c9c2b5';
  ctx.fillRect(0, 0, 256, 256);
  // Large warm rose/beige blossoms matching the chair cover in Photo 3
  const spots = [
    [64, 70, '#c68b85'],
    [176, 64, '#d8b79e'],
    [118, 146, '#d9d2c5'],
    [60, 200, '#b56368'],
    [192, 194, '#b8826e'],
  ] as const;
  for (const [x, y, col] of spots) {
    ctx.fillStyle = '#5c6b4d';
    ctx.beginPath();
    ctx.ellipse(x - 24, y + 14, 18, 8, -0.5, 0, Math.PI * 2);
    ctx.ellipse(x + 24, y - 12, 16, 7, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 28 + rand() * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,245,235,0.5)';
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  return finalizeTexture(canvas, true, anisotropy);
}

function createPrayerClothTexture(anisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#6c1018';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#d9b589';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 220, 220);
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 196, 196);
  for (let y = 52; y < 210; y += 34) {
    for (let x = 52; x < 210; x += 34) {
      ctx.fillStyle = '#e5c9a0';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return finalizeTexture(canvas, true, anisotropy);
}

export function createRoomTextures(maxAnisotropy = 4): RoomTextureSet {
  const aniso = Math.min(maxAnisotropy, 8);
  const wall = createWallTextures(aniso);
  const floor = createFloorTextures(aniso);
  const teakWood = createWoodTexture('#5c3921', '#3b2212', '#7a4f30', aniso, 11);
  const oakWood = createWoodTexture('#b69267', '#8f6b43', '#cca97e', aniso, 22);
  const curtainFloral = createCurtainTexture(aniso);
  const bedFloral = createBedFloralTexture(aniso);
  const drawerFloral = createDrawerFloralTexture(aniso);
  const calligraphyPanels = createCalligraphyPanels(aniso);
  const monitors = createMonitorTextures(aniso);
  const pureitBox = createPureitBoxTexture(aniso);
  const cardboard = createCardboardTexture(aniso);
  const chairCoverFloral = createChairCoverTexture(aniso);
  const prayerCloth = createPrayerClothTexture(aniso);

  const allTextures: THREE.Texture[] = [
    wall.albedo,
    wall.bump,
    floor.albedo,
    floor.bump,
    teakWood,
    oakWood,
    curtainFloral,
    bedFloral,
    drawerFloral,
    ...calligraphyPanels,
    monitors.left,
    monitors.right,
    pureitBox,
    cardboard,
    chairCoverFloral,
    prayerCloth,
  ];

  return {
    wallAlbedo: wall.albedo,
    wallBump: wall.bump,
    floorAlbedo: floor.albedo,
    floorBump: floor.bump,
    teakWood,
    oakWood,
    curtainFloral,
    bedFloral,
    drawerFloral,
    calligraphyPanels,
    monitorLeft: monitors.left,
    monitorRight: monitors.right,
    pureitBox,
    cardboard,
    chairCoverFloral,
    prayerCloth,
    dispose: () => {
      monitors.onDispose();
      allTextures.forEach((t) => t.dispose());
    },
  };
}
