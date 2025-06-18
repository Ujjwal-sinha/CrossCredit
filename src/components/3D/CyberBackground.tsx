import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import GlowingTorus from './GlowingTorus';
import FloatingRings from './FloatingRings';

const CyberParticles: React.FC = () => {
  const ref = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    
    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.05;
      ref.current.rotation.y = state.clock.elapsedTime * 0.075;
    }
  });

  return (
    <Points ref={ref} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#06b6d4"
        size={0.38} // slightly reduced
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

const CyberGrid: React.FC = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      ref.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={ref}>
      <gridHelper args={[100, 50, '#06b6d4', '#06b6d4']} position={[0, -20, 0]} />
      <gridHelper args={[100, 50, '#22d3ee', '#22d3ee']} position={[0, -19.9, 0]} rotation={[0, Math.PI / 4, 0]} />
    </group>
  );
};

const FloatingCubes: React.FC = () => {
  const cubesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (cubesRef.current) {
      cubesRef.current.children.forEach((cube, index) => {
        cube.rotation.x = state.clock.elapsedTime * (0.5 + index * 0.1);
        cube.rotation.y = state.clock.elapsedTime * (0.3 + index * 0.05);
        cube.position.y = Math.sin(state.clock.elapsedTime + index) * 2;
      });
    }
  });

  return (
    <group ref={cubesRef}>
      {Array.from({ length: 20 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 80,
          ]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color="#06b6d4"
            transparent
            opacity={0.18} // reduced from 0.3
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
};

const CyberBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        className="three-canvas"
        camera={{ position: [0, 0, 30], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <CyberParticles />
        <CyberGrid />
        <FloatingCubes />
        <GlowingTorus />
        <FloatingRings />
      </Canvas>
    </div>
  );
};

export default CyberBackground;