import * as THREE from 'three';
import { useEffect, useMemo, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { RoomTextureSet } from '../proceduralTextures';
import { ROOM_BOUNDS } from '../roomConstants';

const PORTFOLIO_WEBSITE_URL = 'https://rifat-bin-alam.vercel.app/';

function openPortfolioWebsite() {
  const anchor = document.createElement('a');
  anchor.href = PORTFOLIO_WEBSITE_URL;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

interface WorkstationAreaProps {
  textures: RoomTextureSet;
}

function RGBFan({
  position,
  rotation = [0, 0, 0],
  radius = 0.046,
  ringColor = '#a855f7',
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  ringColor?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Outer dark fan frame */}
      <mesh>
        <boxGeometry args={[radius * 2.1, radius * 2.1, 0.016]} />
        <meshStandardMaterial color="#12141a" roughness={0.5} />
      </mesh>
      {/* Glowing RGB halo ring */}
      <mesh position={[0, 0, 0.009]}>
        <torusGeometry args={[radius * 0.86, 0.0045, 8, 24]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={2.1}
          roughness={0.25}
        />
      </mesh>
      {/* Center motor hub */}
      <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.28, radius * 0.28, 0.014, 16]} />
        <meshStandardMaterial
          color="#1e1b2e"
          emissive={ringColor}
          emissiveIntensity={0.6}
          roughness={0.35}
        />
      </mesh>
      {/* Fan blades */}
      {[0, 1, 2, 3, 4, 5, 6].map((b) => (
        <mesh
          key={b}
          position={[0, 0, 0.008]}
          rotation={[0, 0, (b / 7) * Math.PI * 2]}
        >
          <boxGeometry args={[radius * 1.45, 0.01, 0.004]} />
          <meshStandardMaterial color="#272734" roughness={0.4} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function WorkstationArea({ textures }: WorkstationAreaProps) {
  const wallZ = ROOM_BOUNDS.minZ; // -1.80
  const [monitorHovered, setMonitorHovered] = useState(false);

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Braided AIO liquid cooler tubes curving from CPU pump block to top radiator
  const aioTubes = useMemo(() => {
    const c1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, 0.26, 0.02),
      new THREE.Vector3(-0.03, 0.31, 0.05),
      new THREE.Vector3(-0.04, 0.38, 0.02),
      new THREE.Vector3(-0.02, 0.4, -0.05),
    ]);
    const c2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, 0.24, 0.035),
      new THREE.Vector3(-0.035, 0.29, 0.065),
      new THREE.Vector3(-0.045, 0.37, 0.035),
      new THREE.Vector3(-0.02, 0.4, -0.02),
    ]);
    return [
      new THREE.TubeGeometry(c1, 18, 0.0065, 8, false),
      new THREE.TubeGeometry(c2, 18, 0.0065, 8, false),
    ];
  }, []);

  return (
    <group name="WorkstationArea">
      {/* Small Wooden Stool + Dual-Chamber Fish-Tank Gaming PC Case (left of desk) */}
      <group name="PCStandAndFishTankCase" position={[-0.56, 0, wallZ + 0.36]}>
        {/* Wooden stool */}
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.025, 0.44]} />
          <meshStandardMaterial map={textures.teakWood} color="#744b2c" roughness={0.65} />
        </mesh>
        {[
          [-0.13, -0.17],
          [0.13, -0.17],
          [-0.13, 0.17],
          [0.13, 0.17],
        ].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.175, lz]} castShadow>
            <boxGeometry args={[0.032, 0.35, 0.032]} />
            <meshStandardMaterial map={textures.teakWood} color="#633e22" roughness={0.7} />
          </mesh>
        ))}

        {/* Modern Dual-Chamber Panoramic Fish-Tank PC Case */}
        <group name="FishTankPCCase" position={[0, 0.375, 0]}>
          {/* Case Rubber Feet */}
          {[
            [-0.11, -0.16],
            [0.11, -0.16],
            [-0.11, 0.16],
            [0.11, 0.16],
          ].map(([fx, fz], i) => (
            <mesh key={i} position={[fx, 0.008, fz]}>
              <cylinderGeometry args={[0.015, 0.018, 0.016, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.7} />
            </mesh>
          ))}

          {/* Bottom Deck & Top Vented Lid */}
          <mesh position={[0, 0.024, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.02, 0.41]} />
            <meshStandardMaterial color="#111318" roughness={0.42} metalness={0.55} />
          </mesh>
          <mesh position={[0, 0.435, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.022, 0.41]} />
            <meshStandardMaterial color="#111318" roughness={0.4} metalness={0.55} />
          </mesh>

          {/* Dual-Chamber Rear/Right PSU & Cable Management Chamber (+X side) */}
          <mesh position={[0.095, 0.23, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.088, 0.395, 0.405]} />
            <meshStandardMaterial color="#14171f" roughness={0.46} metalness={0.45} />
          </mesh>
          {/* Rear I/O & Exhaust Wall (-Z side) */}
          <mesh position={[-0.04, 0.23, -0.195]} castShadow>
            <boxGeometry args={[0.195, 0.395, 0.018]} />
            <meshStandardMaterial color="#13161d" roughness={0.48} metalness={0.45} />
          </mesh>

          {/* Motherboard Tray Divider (between PSU chamber and left glass showcase chamber) */}
          <mesh position={[0.045, 0.23, 0]}>
            <boxGeometry args={[0.01, 0.38, 0.38]} />
            <meshStandardMaterial color="#181b24" roughness={0.5} metalness={0.4} />
          </mesh>

          {/* Motherboard PCB + VRM Heatsinks */}
          <mesh position={[0.032, 0.24, -0.05]}>
            <boxGeometry args={[0.012, 0.27, 0.22]} />
            <meshStandardMaterial color="#0f1117" roughness={0.55} metalness={0.25} />
          </mesh>
          <mesh position={[0.02, 0.28, -0.12]}>
            <boxGeometry args={[0.022, 0.14, 0.04]} />
            <meshStandardMaterial color="#272a36" roughness={0.35} metalness={0.75} />
          </mesh>

          {/* CPU AIO Pump Block with Purple Infinity-Mirror RGB Ring (facing -X glass) */}
          <group position={[0.012, 0.26, -0.04]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.028, 0.03, 0.028, 20]} />
              <meshStandardMaterial color="#14161e" roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[-0.015, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <torusGeometry args={[0.02, 0.004, 8, 20]} />
              <meshStandardMaterial
                color="#c084fc"
                emissive="#a855f7"
                emissiveIntensity={2.4}
              />
            </mesh>
          </group>

          {/* Illuminated Purple RGB DDR5 RAM Modules */}
          {[0.015, 0.032].map((rz, idx) => (
            <group key={idx} position={[0.014, 0.27, rz]}>
              <mesh>
                <boxGeometry args={[0.024, 0.095, 0.008]} />
                <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
              </mesh>
              <mesh position={[-0.013, 0, 0]}>
                <boxGeometry args={[0.004, 0.092, 0.006]} />
                <meshStandardMaterial
                  color="#c084fc"
                  emissive="#9333ea"
                  emissiveIntensity={2.0}
                />
              </mesh>
            </group>
          ))}

          {/* Modern Horizontal Triple-Fan GPU with Purple RGB Light Bar (facing -X glass) */}
          <group position={[-0.02, 0.16, -0.03]}>
            <mesh castShadow>
              <boxGeometry args={[0.095, 0.042, 0.25]} />
              <meshStandardMaterial color="#1b1e28" roughness={0.35} metalness={0.65} />
            </mesh>
            {/* Glowing purple edge strip on GPU */}
            <mesh position={[-0.049, 0.008, 0]}>
              <boxGeometry args={[0.004, 0.009, 0.21]} />
              <meshStandardMaterial
                color="#c084fc"
                emissive="#a855f7"
                emissiveIntensity={2.3}
              />
            </mesh>
          </group>

          {/* Top 240mm Radiator + Dual Purple RGB Exhaust Fans */}
          <mesh position={[-0.04, 0.415, -0.02]}>
            <boxGeometry args={[0.12, 0.022, 0.26]} />
            <meshStandardMaterial color="#15171e" roughness={0.5} metalness={0.5} />
          </mesh>
          <RGBFan
            position={[-0.04, 0.392, -0.085]}
            rotation={[Math.PI / 2, 0, 0]}
            radius={0.045}
            ringColor="#a855f7"
          />
          <RGBFan
            position={[-0.04, 0.392, 0.035]}
            rotation={[Math.PI / 2, 0, 0]}
            radius={0.045}
            ringColor="#9333ea"
          />

          {/* Side Intake Purple RGB Fans (mounted vertically on inner divider facing -X) */}
          <RGBFan
            position={[0.03, 0.29, 0.115]}
            rotation={[0, -Math.PI / 2, 0]}
            radius={0.046}
            ringColor="#a855f7"
          />
          <RGBFan
            position={[0.03, 0.16, 0.115]}
            rotation={[0, -Math.PI / 2, 0]}
            radius={0.046}
            ringColor="#8b5cf6"
          />

          {/* Rear Exhaust Purple RGB Fan */}
          <RGBFan
            position={[-0.04, 0.29, -0.18]}
            rotation={[0, 0, 0]}
            radius={0.044}
            ringColor="#a855f7"
          />

          {/* AIO Braided Tubes */}
          <mesh geometry={aioTubes[0]}>
            <meshStandardMaterial color="#16161c" roughness={0.75} />
          </mesh>
          <mesh geometry={aioTubes[1]}>
            <meshStandardMaterial color="#16161c" roughness={0.75} />
          </mesh>

          {/* Subtle Purple RGB Interior Case Lighting */}
          <pointLight
            position={[-0.04, 0.24, 0.03]}
            color="#a855f7"
            intensity={1.65}
            distance={1.6}
            decay={1.8}
          />

          {/* Panoramic Frameless Tempered Glass (Left Side -X and Front +Z) */}
          <mesh position={[-0.138, 0.23, 0]} renderOrder={4}>
            <boxGeometry args={[0.006, 0.39, 0.4]} />
            <meshPhysicalMaterial
              color="#d8b4fe"
              roughness={0.06}
              metalness={0.08}
              transparent
              opacity={0.18}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[-0.04, 0.23, 0.202]} renderOrder={4}>
            <boxGeometry args={[0.195, 0.39, 0.006]} />
            <meshPhysicalMaterial
              color="#d8b4fe"
              roughness={0.06}
              metalness={0.08}
              transparent
              opacity={0.18}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      {/* Wooden Computer Desk */}
      <group name="ComputerDesk" position={[0.22, 0, wallZ + 0.37]}>
        {/* Tabletop */}
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.14, 0.03, 0.6]} />
          <meshStandardMaterial map={textures.oakWood} color="#c49f71" roughness={0.58} />
        </mesh>
        {/* Left side panel */}
        <mesh position={[-0.55, 0.365, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.025, 0.73, 0.56]} />
          <meshStandardMaterial map={textures.oakWood} color="#b79164" roughness={0.62} />
        </mesh>
        {/* Back modesty panel */}
        <mesh position={[0, 0.42, -0.26]} receiveShadow>
          <boxGeometry args={[1.08, 0.58, 0.02]} />
          <meshStandardMaterial map={textures.oakWood} color="#a98459" roughness={0.68} />
        </mesh>
        {/* Left drawer & lower compartment */}
        <mesh position={[-0.2, 0.56, 0.01]} castShadow receiveShadow>
          <boxGeometry args={[0.66, 0.14, 0.52]} />
          <meshStandardMaterial map={textures.oakWood} color="#b89468" roughness={0.6} />
        </mesh>
        <mesh position={[-0.2, 0.34, 0.01]} castShadow receiveShadow>
          <boxGeometry args={[0.66, 0.28, 0.5]} />
          <meshStandardMaterial map={textures.oakWood} color="#a78358" roughness={0.66} />
        </mesh>
        {/* Keyhole accent */}
        <mesh position={[-0.2, 0.36, 0.265]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.008, 12]} />
          <meshStandardMaterial color="#b0b5ba" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Right pedestal cabinet */}
        <mesh position={[0.35, 0.365, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.73, 0.56]} />
          <meshStandardMaterial map={textures.oakWood} color="#ba9467" roughness={0.62} />
        </mesh>

        {/* Large Black Desk Mat */}
        <mesh position={[0.04, 0.758, 0.04]} receiveShadow>
          <boxGeometry args={[0.94, 0.005, 0.44]} />
          <meshStandardMaterial color="#17191c" roughness={0.88} />
        </mesh>

        {/* Left Monitor (24" Silver V-Stand — Interactive Portfolio Display) */}
        <group name="LeftMonitor" position={[-0.14, 0.76, -0.14]}>
          <mesh position={[0, 0.008, 0.02]} castShadow>
            <boxGeometry args={[0.24, 0.012, 0.16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.1, -0.03]}>
            <boxGeometry args={[0.032, 0.2, 0.022]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.54, 0.32, 0.02]} />
            <meshStandardMaterial color="#16181d" roughness={0.42} />
          </mesh>
          <mesh
            name="MainPortfolioMonitorScreen"
            position={[0, 0.22, 0.012]}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setMonitorHovered(true);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setMonitorHovered(false);
              document.body.style.cursor = 'auto';
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              if (e.delta > 6) return;
              openPortfolioWebsite();
            }}
          >
            <planeGeometry args={[0.515, 0.295]} />
            <meshStandardMaterial
              map={textures.monitorLeft}
              emissiveMap={textures.monitorLeft}
              emissive="#ffffff"
              emissiveIntensity={monitorHovered ? 1.15 : 0.88}
              roughness={0.22}
            />
          </mesh>
        </group>

        {/* Right Monitor (27" Dell-style angled inward) */}
        <group name="RightMonitor" position={[0.42, 0.76, -0.09]} rotation={[0, -0.26, 0]}>
          <mesh position={[0, 0.008, 0.01]} castShadow>
            <boxGeometry args={[0.22, 0.012, 0.18]} />
            <meshStandardMaterial color="#181a1f" roughness={0.45} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.12, -0.04]}>
            <boxGeometry args={[0.04, 0.24, 0.028]} />
            <meshStandardMaterial color="#181a1f" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.24, 0]} castShadow>
            <boxGeometry args={[0.6, 0.35, 0.022]} />
            <meshStandardMaterial color="#111317" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.24, 0.013]}>
            <planeGeometry args={[0.575, 0.325]} />
            <meshStandardMaterial
              map={textures.monitorRight}
              emissiveMap={textures.monitorRight}
              emissive="#ffffff"
              emissiveIntensity={0.78}
              roughness={0.22}
            />
          </mesh>
        </group>

        {/* Dual Desktop Speakers with Subtle Purple/Blue Accents */}
        {[-0.36, 0.04].map((sx, idx) => (
          <group key={idx} position={[sx, 0.81, -0.18]}>
            <mesh castShadow>
              <boxGeometry args={[0.085, 0.1, 0.08]} />
              <meshStandardMaterial color="#18181b" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.02, 0.042]}>
              <boxGeometry args={[0.068, 0.022, 0.004]} />
              <meshStandardMaterial
                color={idx === 0 ? '#a855f7' : '#3b82f6'}
                emissive={idx === 0 ? '#a855f7' : '#3b82f6'}
                emissiveIntensity={0.95}
              />
            </mesh>
          </group>
        ))}

        {/* Premium Gaming Mechanical Keyboard with Purple & Blue RGB Backlighting */}
        <group name="GamingKeyboard" position={[-0.08, 0.768, 0.12]} rotation={[0.05, 0, 0]}>
          {/* Dark anodized aluminum frame */}
          <mesh castShadow>
            <boxGeometry args={[0.41, 0.018, 0.145]} />
            <meshStandardMaterial color="#14151b" roughness={0.38} metalness={0.6} />
          </mesh>
          {/* Subtle purple-blue RGB diffuser plate under keycaps */}
          <mesh position={[-0.09, 0.0095, 0]}>
            <boxGeometry args={[0.19, 0.004, 0.118]} />
            <meshStandardMaterial
              color="#9333ea"
              emissive="#8b5cf6"
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh position={[0.095, 0.0095, 0]}>
            <boxGeometry args={[0.18, 0.004, 0.118]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#6366f1"
              emissiveIntensity={1.2}
            />
          </mesh>
          {/* Sculpted matte dark keycap rows so purple/blue backlighting shines between keys */}
          {[-0.044, -0.022, 0, 0.022, 0.044].map((kz, rowIdx) => (
            <mesh key={rowIdx} position={[0, 0.015, kz]} castShadow>
              <boxGeometry
                args={[rowIdx === 4 ? 0.36 : 0.375, 0.009, 0.015]}
              />
              <meshStandardMaterial color="#1c1e26" roughness={0.55} />
            </mesh>
          ))}
          {/* Subtle front-edge RGB light strip */}
          <mesh position={[0, -0.003, 0.073]}>
            <boxGeometry args={[0.39, 0.003, 0.003]} />
            <meshStandardMaterial
              color="#818cf8"
              emissive="#7c3aed"
              emissiveIntensity={1.1}
            />
          </mesh>
        </group>

        {/* Modern Sculpted Gaming Mouse with Purple-Blue Illuminated Accents */}
        <group name="GamingMouse" position={[0.25, 0.768, 0.12]}>
          {/* Ergonomic dark matte body */}
          <mesh scale={[0.85, 0.58, 1.35]} castShadow>
            <sphereGeometry args={[0.03, 18, 14]} />
            <meshStandardMaterial color="#161820" roughness={0.42} metalness={0.18} />
          </mesh>
          {/* Illuminated scroll wheel */}
          <mesh position={[0, 0.015, -0.016]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.007, 14]} />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#6366f1"
              emissiveIntensity={1.6}
            />
          </mesh>
          {/* Subtle purple-blue rear palm & side accent lines */}
          <mesh position={[0, 0.006, 0.025]}>
            <boxGeometry args={[0.026, 0.003, 0.018]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#9333ea"
              emissiveIntensity={1.35}
            />
          </mesh>
          <mesh position={[-0.022, -0.003, 0.006]}>
            <boxGeometry args={[0.003, 0.003, 0.044]} />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#3b82f6"
              emissiveIntensity={1.25}
            />
          </mesh>
        </group>
      </group>

      {/* Wooden Desk Chair (slatted curved backrest, tucked in front of desk) */}
      <group name="DeskChair" position={[0.14, 0, wallZ + 0.94]} rotation={[0, Math.PI + 0.08, 0]}>
        <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.44, 0.035, 0.42]} />
          <meshStandardMaterial map={textures.oakWood} color="#9e7449" roughness={0.62} />
        </mesh>
        {[
          [-0.18, -0.17],
          [0.18, -0.17],
          [-0.18, 0.17],
          [0.18, 0.17],
        ].map(([lx, lz], idx) => (
          <mesh key={idx} position={[lx, 0.22, lz]} castShadow>
            <boxGeometry args={[0.038, 0.44, 0.038]} />
            <meshStandardMaterial map={textures.oakWood} color="#8c633b" roughness={0.66} />
          </mesh>
        ))}
        <mesh position={[-0.19, 0.66, -0.18]} castShadow>
          <boxGeometry args={[0.038, 0.44, 0.038]} />
          <meshStandardMaterial map={textures.oakWood} color="#8c633b" roughness={0.66} />
        </mesh>
        <mesh position={[0.19, 0.66, -0.18]} castShadow>
          <boxGeometry args={[0.038, 0.44, 0.038]} />
          <meshStandardMaterial map={textures.oakWood} color="#8c633b" roughness={0.66} />
        </mesh>
        <mesh position={[0, 0.85, -0.18]} castShadow>
          <boxGeometry args={[0.44, 0.075, 0.035]} />
          <meshStandardMaterial map={textures.oakWood} color="#9e7449" roughness={0.6} />
        </mesh>
        {[-0.1, 0, 0.1].map((sx, idx) => (
          <mesh key={idx} position={[sx, 0.64, -0.18]} castShadow>
            <boxGeometry args={[0.045, 0.36, 0.022]} />
            <meshStandardMaterial map={textures.oakWood} color="#926940" roughness={0.64} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
