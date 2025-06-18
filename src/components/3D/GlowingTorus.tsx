import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GlowingTorus: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 10, 0]}>
      <torusKnotGeometry args={[3, 0.5, 100, 16]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#38bdf8"
        emissiveIntensity={0.25} // reduced from 0.7
        metalness={0.5} // slightly reduced
        roughness={0.3} // slightly increased
        transparent
        opacity={0.32} // reduced from 0.5
      />
    </mesh>
  );
};

export default GlowingTorus;
