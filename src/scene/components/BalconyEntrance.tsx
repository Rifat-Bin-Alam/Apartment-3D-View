import { useEffect, useMemo, useRef, useState } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BalconyEntranceProps {
  position: [number, number, number];
  rotationY?: number;
  label: string;
  icon?: 'door' | 'back' | 'home';
  accent?: 'purple' | 'emerald';
  disabled?: boolean;
  onActivate: () => void;
  onPreload?: () => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function createBadgeTexture(
  label: string,
  icon: 'door' | 'back' | 'home',
  isEmerald: boolean,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer pill card
  const pad = 12;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  drawRoundedRect(ctx, pad, pad, w, h, h / 2);

  const bgGrad = ctx.createLinearGradient(0, pad, canvas.width, canvas.height - pad);
  if (isEmerald) {
    bgGrad.addColorStop(0, '#072219');
    bgGrad.addColorStop(1, '#0d3428');
  } else {
    bgGrad.addColorStop(0, '#180d2e');
    bgGrad.addColorStop(1, '#261447');
  }
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Crisp glowing border
  ctx.lineWidth = 6;
  ctx.strokeStyle = isEmerald ? '#6ee7b7' : '#d8b4fe';
  ctx.stroke();

  // Inner subtle highlight ring
  drawRoundedRect(ctx, pad + 8, pad + 8, w - 16, h - 16, (h - 16) / 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = isEmerald ? 'rgba(167, 243, 208, 0.25)' : 'rgba(233, 213, 255, 0.25)';
  ctx.stroke();

  // Icon badge circle on left
  const iconCx = 94;
  const iconCy = canvas.height / 2;
  ctx.beginPath();
  ctx.arc(iconCx, iconCy, 42, 0, Math.PI * 2);
  ctx.fillStyle = isEmerald ? 'rgba(16, 185, 129, 0.24)' : 'rgba(168, 85, 247, 0.28)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = isEmerald ? '#34d399' : '#c084fc';
  ctx.stroke();

  // Crisp vector icon inside circle
  ctx.strokeStyle = isEmerald ? '#a7f3d0' : '#f3e8ff';
  ctx.fillStyle = isEmerald ? '#a7f3d0' : '#f3e8ff';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (icon === 'home') {
    // House silhouette + subtle arrow
    ctx.beginPath();
    ctx.moveTo(iconCx - 20, iconCy - 2);
    ctx.lineTo(iconCx, iconCy - 20);
    ctx.lineTo(iconCx + 20, iconCy - 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconCx - 14, iconCy - 4);
    ctx.lineTo(iconCx - 14, iconCy + 17);
    ctx.lineTo(iconCx + 14, iconCy + 17);
    ctx.lineTo(iconCx + 14, iconCy - 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(iconCx - 5, iconCy + 4, 10, 13);
    ctx.fill();
  } else if (icon === 'back') {
    ctx.beginPath();
    ctx.moveTo(iconCx + 16, iconCy);
    ctx.lineTo(iconCx - 14, iconCy);
    ctx.moveTo(iconCx - 4, iconCy - 12);
    ctx.lineTo(iconCx - 16, iconCy);
    ctx.lineTo(iconCx - 4, iconCy + 12);
    ctx.stroke();
  } else {
    // Open door frame + ajar door + directional arrow
    ctx.beginPath();
    ctx.moveTo(iconCx - 16, iconCy + 18);
    ctx.lineTo(iconCx - 16, iconCy - 18);
    ctx.lineTo(iconCx + 8, iconCy - 18);
    ctx.lineTo(iconCx + 8, iconCy + 18);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconCx - 16, iconCy - 18);
    ctx.lineTo(iconCx + 1, iconCy - 13);
    ctx.lineTo(iconCx + 1, iconCy + 15);
    ctx.lineTo(iconCx - 16, iconCy + 18);
    ctx.closePath();
    ctx.fill();

    // Right directional arrow beside open door
    ctx.beginPath();
    ctx.moveTo(iconCx + 12, iconCy);
    ctx.lineTo(iconCx + 22, iconCy);
    ctx.moveTo(iconCx + 17, iconCy - 6);
    ctx.lineTo(iconCx + 23, iconCy);
    ctx.lineTo(iconCx + 17, iconCy + 6);
    ctx.stroke();
  }

  // Bold readable uppercase text
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 40px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(label.toUpperCase(), 156, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function createHaloTexture(isEmerald: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 64, 14, 128, 64, 122);
  if (isEmerald) {
    grad.addColorStop(0, 'rgba(52, 211, 153, 0.85)');
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.35)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  } else {
    grad.addColorStop(0, 'rgba(192, 132, 252, 0.85)');
    grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.35)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function BalconyEntrance({
  position,
  rotationY = 0,
  label,
  icon = 'door',
  accent = 'purple',
  disabled = false,
  onActivate,
  onPreload,
}: BalconyEntranceProps) {
  const isEmerald = accent === 'emerald';
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const badgeTex = useMemo(
    () => createBadgeTexture(label, icon, isEmerald),
    [label, icon, isEmerald],
  );
  const haloTex = useMemo(() => createHaloTexture(isEmerald), [isEmerald]);

  useEffect(() => {
    return () => {
      badgeTex.dispose();
    };
  }, [badgeTex]);

  useEffect(() => {
    return () => {
      haloTex.dispose();
    };
  }, [haloTex]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = clock.elapsedTime;

    if (groupRef.current) {
      const floatY = disabled ? 0 : Math.sin(t * 2.6) * 0.011;
      groupRef.current.position.y = floatY;

      const targetScale = disabled ? 0.92 : hovered ? 1.08 : 1 + Math.sin(t * 2.6) * 0.025;
      const nextScale = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 8, delta);
      groupRef.current.scale.setScalar(nextScale);
    }

    if (haloRef.current && haloMatRef.current) {
      if (disabled) {
        haloMatRef.current.opacity = THREE.MathUtils.damp(haloMatRef.current.opacity, 0.1, 6, delta);
      } else {
        const pulse = (Math.sin(t * 3.4) + 1) * 0.5;
        const s = 1 + pulse * 0.16;
        haloRef.current.scale.set(s, s * 1.05, 1);
        haloMatRef.current.opacity = hovered ? 0.92 : 0.45 + pulse * 0.42;
      }
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!disabled) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
      onPreload?.();
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!disabled) {
      document.body.style.cursor = 'auto';
      onActivate();
    }
  };

  return (
    <group name="BalconyDoorPortalButton" position={position} rotation={[0, rotationY, 0]}>
      <group ref={groupRef}>
        {/* Pulsing 3D Glow Aura Halo behind Plaque */}
        <mesh ref={haloRef} position={[0, 0, -0.008]}>
          <planeGeometry args={[0.72, 0.25]} />
          <meshBasicMaterial
            ref={haloMatRef}
            map={haloTex}
            transparent
            opacity={0.75}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Physical 3D Dark Backing Frame */}
        <mesh position={[0, 0, -0.002]} castShadow>
          <boxGeometry args={[0.56, 0.168, 0.012]} />
          <meshStandardMaterial
            color={isEmerald ? '#072219' : '#180d2e'}
            emissive={isEmerald ? '#10b981' : '#a855f7'}
            emissiveIntensity={hovered && !disabled ? 0.55 : 0.24}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>

        {/* Crisp Emissive Pill Label Plane on Front Face */}
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.56, 0.168]} />
          <meshBasicMaterial
            map={badgeTex}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Generous Invisible Raycast Hit Target for Reliable Desktop Click & Mobile Tap */}
        <mesh
          position={[0, 0, 0.02]}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <boxGeometry args={[0.64, 0.24, 0.1]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
