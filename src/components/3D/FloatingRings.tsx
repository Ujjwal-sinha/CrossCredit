import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FloatingRings: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((ring, idx) => {
        ring.rotation.z += 0.002 + idx * 0.0005;
        ring.position.x = Math.sin(state.clock.elapsedTime * 0.2 + idx) * 10 + idx * 2;
        ring.position.y = Math.cos(state.clock.elapsedTime * 0.2 + idx) * 5 + idx * 1.5;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[i * 4 - 8, 0, -10 + i * 4]}>
          <torusGeometry args={[2 + i * 0.5, 0.15, 16, 100]} />
          <meshStandardMaterial
            color="#a5f3fc"
            emissive="#a5f3fc"
            emissiveIntensity={0.15} // reduced from 0.4
            transparent
            opacity={0.18} // reduced from 0.3
            metalness={0.4} // slightly reduced
            roughness={0.4} // slightly increased for softer look
          />
        </mesh>
      ))}
    </group>
  );
};

export default FloatingRings;
