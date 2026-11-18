import * as THREE from 'three';
import { RoomTextureSet } from '../proceduralTextures';
import { ROOM_BOUNDS } from '../roomConstants';

interface BedAndWindowsProps {
  textures: RoomTextureSet;
}

function CurtainedWindow({
  position,
  rotationY,
  width = 1.66,
  height = 1.98,
  curtainTexture,
  withSunlightSeam = false,
}: {
  position: [number, number, number];
  rotationY: number;
  width?: number;
  height?: number;
  curtainTexture: THREE.Texture;
  withSunlightSeam?: boolean;
}) {
  const halfPanelW = width * 0.49;

  return (
    <group name="CurtainedWindow" position={position} rotation={[0, rotationY, 0]}>
      {/* Window Backing Frame (behind curtain) */}
      <mesh position={[0, -0.04, -0.02]}>
        <planeGeometry args={[width - 0.16, height - 0.35]} />
        <meshStandardMaterial
          color={withSunlightSeam ? '#7aa38a' : '#2f4539'}
          emissive={withSunlightSeam ? '#d97706' : '#1e293b'}
          emissiveIntensity={withSunlightSeam ? 0.28 : 0.08}
          roughness={0.8}
        />
      </mesh>

      {/* Dark Metal Curtain Rod + End Finials */}
      <mesh position={[0, height / 2 + 0.03, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, width + 0.16, 12]} />
        <meshStandardMaterial color="#27272a" metalness={0.75} roughness={0.35} />
      </mesh>
      {[-width / 2 - 0.08, width / 2 + 0.08].map((fx, i) => (
        <mesh key={i} position={[fx, height / 2 + 0.03, 0.05]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial color="#27272a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Silver Grommet Rings along top of curtains */}
      {Array.from({ length: 12 }).map((_, idx) => {
        const gx = -width / 2 + 0.08 + (idx / 11) * (width - 0.16);
        return (
          <mesh key={idx} position={[gx, height / 2 + 0.01, 0.056]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.022, 0.005, 8, 16]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.85} roughness={0.22} />
          </mesh>
        );
      })}

      {/* Left & Right Floral Garden Curtain Panels */}
      {[-width * 0.255, width * 0.255].map((px, idx) => (
        <mesh key={idx} position={[px, 0, 0.045]} castShadow receiveShadow>
          <boxGeometry args={[halfPanelW, height, 0.018]} />
          <meshStandardMaterial
            map={curtainTexture}
            roughness={0.88}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function BedAndWindows({ textures }: BedAndWindowsProps) {
  const rightWallX = ROOM_BOUNDS.maxX; // +1.90
  const backWallZ = ROOM_BOUNDS.maxZ; // +1.80

  return (
    <group name="BedAndWindows">
      {/* Right Wall Window & Floral Curtains */}
      <CurtainedWindow
        position={[rightWallX - 0.05, 1.09, 0.02]}
        rotationY={-Math.PI / 2}
        width={1.68}
        height={1.96}
        curtainTexture={textures.curtainFloral}
      />

      {/* Back Wall Window & Floral Curtains (above bed) */}
      <CurtainedWindow
        position={[0.07, 1.24, backWallZ - 0.05]}
        rotationY={Math.PI}
        width={1.64}
        height={1.66}
        curtainTexture={textures.curtainFloral}
        withSunlightSeam={true}
      />

      {/* Wooden Side Chair in front of Right Curtain */}
      <group name="RightSideChair" position={[rightWallX - 0.34, 0, -0.35]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Seat */}
        <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.032, 0.42]} />
          <meshStandardMaterial map={textures.teakWood} color="#7c5230" roughness={0.65} />
        </mesh>
        {/* 4 Legs */}
        {[
          [-0.17, -0.17],
          [0.17, -0.17],
          [-0.17, 0.17],
          [0.17, 0.17],
        ].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.215, lz]} castShadow>
            <boxGeometry args={[0.036, 0.43, 0.036]} />
            <meshStandardMaterial map={textures.teakWood} color="#6b4526" roughness={0.7} />
          </mesh>
        ))}
        {/* Backrest Frame */}
        <mesh position={[0, 0.71, -0.19]} castShadow>
          <boxGeometry args={[0.42, 0.54, 0.03]} />
          <meshStandardMaterial map={textures.teakWood} color="#754c2b" roughness={0.66} />
        </mesh>
        {/* Draped Floral Backrest Cover (Photo 3) */}
        <mesh position={[0, 0.74, -0.172]} castShadow>
          <boxGeometry args={[0.38, 0.46, 0.046]} />
          <meshStandardMaterial map={textures.chairCoverFloral} roughness={0.86} />
        </mesh>
        {/* Crumpled Yellow Garment on Seat */}
        <mesh position={[-0.06, 0.48, 0.02]} rotation={[0.2, 0.4, 0.1]} castShadow>
          <dodecahedronGeometry args={[0.095, 1]} />
          <meshStandardMaterial color="#eab308" roughness={0.85} />
        </mesh>
        {/* Stainless Steel Mug on Seat */}
        <mesh position={[0.11, 0.495, 0.08]} castShadow>
          <cylinderGeometry args={[0.038, 0.035, 0.095, 18]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.88} roughness={0.18} />
        </mesh>
      </group>

      {/* Wooden Bed in Back-Right Corner (+X, +Z) */}
      <group name="Bed" position={[0.92, 0, 1.04]}>
        {/* Carved Teak Headboard against Right Wall (+X) */}
        <group name="BedHeadboard" position={[0.9, 0, 0]}>
          {/* Main headboard panel */}
          <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.075, 1.24, 1.44]} />
            <meshStandardMaterial map={textures.teakWood} color="#724727" roughness={0.56} />
          </mesh>
          {/* Decorative arched top crown molding */}
          <mesh position={[-0.015, 1.22, 0]} castShadow>
            <boxGeometry args={[0.08, 0.08, 1.48]} />
            <meshStandardMaterial map={textures.teakWood} color="#633c1f" roughness={0.54} />
          </mesh>
          {/* Carved corner posts */}
          {[-0.7, 0.7].map((pz, i) => (
            <mesh key={i} position={[0, 0.64, pz]} castShadow>
              <boxGeometry args={[0.09, 1.28, 0.08]} />
              <meshStandardMaterial map={textures.teakWood} color="#5e381c" roughness={0.56} />
            </mesh>
          ))}
          {/* Upper relief carving trim */}
          <mesh position={[-0.042, 0.94, 0]}>
            <boxGeometry args={[0.015, 0.24, 1.16]} />
            <meshStandardMaterial map={textures.teakWood} color="#825330" roughness={0.52} />
          </mesh>

          {/* Draped Light-Green Towel & Maroon Patterned Prayer Cloth over Headboard Left */}
          <mesh position={[-0.048, 0.88, -0.5]} rotation={[0, 0, 0.03]} castShadow>
            <boxGeometry args={[0.045, 0.64, 0.26]} />
            <meshStandardMaterial color="#b9c99e" roughness={0.9} />
          </mesh>
          <mesh position={[-0.06, 0.94, -0.28]} rotation={[0, 0, 0.04]} castShadow>
            <boxGeometry args={[0.048, 0.56, 0.28]} />
            <meshStandardMaterial map={textures.prayerCloth} roughness={0.86} />
          </mesh>
        </group>

        {/* Wooden Bed Base Frame */}
        <mesh position={[-0.02, 0.19, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.92, 0.34, 1.44]} />
          <meshStandardMaterial map={textures.teakWood} color="#623b1e" roughness={0.62} />
        </mesh>

        {/* Mattress with Crimson Floral Bedsheet */}
        <mesh position={[-0.02, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.86, 0.16, 1.38]} />
          <meshStandardMaterial map={textures.bedFloral} roughness={0.86} />
        </mesh>

        {/* Two Rectangular Red Floral Pillows against Headboard */}
        {[-0.34, 0.34].map((pz, i) => (
          <mesh
            key={`head-pillow-${i}`}
            position={[0.66, 0.57, pz]}
            rotation={[0, 0, -0.24]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.34, 0.13, 0.56]} />
            <meshStandardMaterial map={textures.bedFloral} roughness={0.88} />
          </mesh>
        ))}

        {/* Long Cylindrical Red Floral Bolster Pillow (Kolbalish) against Back Wall */}
        <mesh
          position={[0.02, 0.58, 0.5]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <capsuleGeometry args={[0.11, 0.68, 8, 18]} />
          <meshStandardMaterial map={textures.bedFloral} roughness={0.88} />
        </mesh>

        {/* Foot-End Floral Pillow */}
        <mesh
          position={[-0.72, 0.55, 0.05]}
          rotation={[0, 0.08, 0.12]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.34, 0.12, 0.54]} />
          <meshStandardMaterial map={textures.bedFloral} roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
}
