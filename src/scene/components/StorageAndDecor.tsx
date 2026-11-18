import { RoomTextureSet } from '../proceduralTextures';
import { ROOM_BOUNDS } from '../roomConstants';

interface StorageAndDecorProps {
  textures: RoomTextureSet;
}

export function StorageAndDecor({ textures }: StorageAndDecorProps) {
  const wallZ = ROOM_BOUNDS.minZ; // -1.80
  const leftWallX = ROOM_BOUNDS.minX; // -1.90

  return (
    <group name="StorageAndDecor">
      {/* Pink & Cream 4-Tier Floral Plastic Drawer Cabinet (front-right corner) */}
      <group name="PinkDrawerCabinet" position={[1.24, 0, wallZ + 0.28]}>
        {/* Pink outer body shell */}
        <mesh position={[0, 0.52, -0.01]} castShadow receiveShadow>
          <boxGeometry args={[0.66, 1.04, 0.44]} />
          <meshStandardMaterial color="#d88ea0" roughness={0.42} metalness={0.05} />
        </mesh>
        {/* Cream top plate */}
        <mesh position={[0, 1.045, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.67, 0.025, 0.46]} />
          <meshStandardMaterial color="#d8d1be" roughness={0.45} />
        </mesh>

        {/* Top tier: 2 side-by-side half drawers */}
        {[-0.158, 0.158].map((dx, idx) => (
          <mesh key={`top-${idx}`} position={[dx, 0.905, 0.215]} castShadow>
            <boxGeometry args={[0.3, 0.23, 0.024]} />
            <meshStandardMaterial map={textures.drawerFloral} roughness={0.38} />
          </mesh>
        ))}

        {/* Lower 3 full-width floral butterfly drawers */}
        {[0.655, 0.405, 0.155].map((dy, idx) => (
          <mesh key={`drawer-${idx}`} position={[0, dy, 0.215]} castShadow>
            <boxGeometry args={[0.62, 0.23, 0.024]} />
            <meshStandardMaterial map={textures.drawerFloral} roughness={0.38} />
          </mesh>
        ))}

        {/* Items on top of the drawer cabinet (matching Photos 2 & 3) */}
        <group name="CabinetTopItems" position={[0, 1.06, 0]}>
          {/* Blue book / box at back left */}
          <mesh position={[-0.18, 0.1, -0.14]} castShadow>
            <boxGeometry args={[0.18, 0.2, 0.06]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
          </mesh>
          {/* White bag / box behind mirror */}
          <mesh position={[-0.02, 0.12, -0.1]} castShadow>
            <boxGeometry args={[0.2, 0.24, 0.11]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.78} />
          </mesh>
          {/* Black round vanity mirror on stand */}
          <group position={[0.14, 0.09, -0.04]} rotation={[0, -0.25, 0]}>
            <mesh position={[0, -0.075, 0]}>
              <boxGeometry args={[0.14, 0.02, 0.1]} />
              <meshStandardMaterial color="#18181b" roughness={0.4} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.022, 24]} />
              <meshStandardMaterial color="#18181b" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.013]}>
              <circleGeometry args={[0.076, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.08} />
            </mesh>
          </group>
          {/* Small yellow fruit/orb & medicine bottle near front edge */}
          <mesh position={[-0.06, 0.032, 0.11]} castShadow>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial color="#eab308" roughness={0.55} />
          </mesh>
          <group position={[0.04, 0.045, 0.08]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.08, 16]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.045, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.018, 16]} />
              <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
            </mesh>
          </group>
          {/* Small black box on far left */}
          <mesh position={[-0.24, 0.045, 0.06]} castShadow>
            <boxGeometry args={[0.12, 0.09, 0.14]} />
            <meshStandardMaterial color="#1f2937" roughness={0.55} />
          </mesh>
        </group>
      </group>

      {/* 5-Panel Islamic Calligraphy Wall Art (mounted above desk/monitors on Front Wall) */}
      <group name="CalligraphyWallArt" position={[0.64, 1.82, wallZ + 0.014]}>
        {[
          { x: -0.34, w: 0.14, h: 0.27 },
          { x: -0.18, w: 0.14, h: 0.34 },
          { x: 0.0, w: 0.17, h: 0.42 },
          { x: 0.18, w: 0.14, h: 0.34 },
          { x: 0.34, w: 0.14, h: 0.27 },
        ].map((panel, idx) => (
          <mesh key={idx} position={[panel.x, 0, 0]} castShadow>
            <boxGeometry args={[panel.w, panel.h, 0.015]} />
            <meshStandardMaterial
              map={textures.calligraphyPanels[idx]}
              roughness={0.62}
              metalness={0.04}
            />
          </mesh>
        ))}
      </group>

      {/* Left Wall Upper Loft Shelf Items (matching Photo 1 from Back to Front) */}
      <group name="LoftShelfItems">
        {/* Brown cardboard box (far back-left end) */}
        <mesh position={[leftWallX + 0.26, 2.27, 1.54]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.26, 0.22]} />
          <meshStandardMaterial map={textures.cardboard} roughness={0.88} />
        </mesh>

        {/* Unilever Pureit Classic 23L Blue & Yellow Box */}
        <mesh position={[leftWallX + 0.32, 2.34, 1.06]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.4, 0.56]} />
          <meshStandardMaterial map={textures.pureitBox} roughness={0.55} />
        </mesh>

        {/* Black electronics/hardware box */}
        <mesh position={[leftWallX + 0.28, 2.21, 0.54]} castShadow>
          <boxGeometry args={[0.28, 0.14, 0.3]} />
          <meshStandardMaterial color="#18191c" roughness={0.55} />
        </mesh>

        {/* Stacked white boxes & papers */}
        <mesh position={[leftWallX + 0.25, 2.2, 0.22]} rotation={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.26, 0.12, 0.24]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.75} />
        </mesh>

        {/* Tan box with orange handles in middle */}
        <group position={[leftWallX + 0.28, 2.22, -0.18]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.15, 0.26]} />
            <meshStandardMaterial map={textures.cardboard} color="#c4b299" roughness={0.8} />
          </mesh>
          <mesh position={[0.02, 0.08, -0.12]}>
            <boxGeometry args={[0.02, 0.03, 0.06]} />
            <meshStandardMaterial color="#ea580c" roughness={0.6} />
          </mesh>
          <mesh position={[0.02, 0.08, 0.12]}>
            <boxGeometry args={[0.02, 0.03, 0.06]} />
            <meshStandardMaterial color="#ea580c" roughness={0.6} />
          </mesh>
        </group>

        {/* Translucent plastic tub near front-right end of shelf */}
        <mesh position={[leftWallX + 0.28, 2.19, -1.36]} castShadow>
          <boxGeometry args={[0.26, 0.1, 0.22]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.55} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
