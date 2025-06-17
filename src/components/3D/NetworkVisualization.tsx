import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNode {
  id: string;
  position: [number, number, number];
  color: string;
  label: string;
}

interface NetworkConnection {
  from: string;
  to: string;
  color: string;
}

const NetworkNode: React.FC<{ node: NetworkNode; isActive: boolean }> = ({ node, isActive }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime;
      meshRef.current.scale.setScalar(isActive ? 1.2 : 1);
    }
  });

  return (
    <group position={node.position}>
      <Sphere ref={meshRef} args={[0.5, 32, 32]}>
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isActive ? 0.5 : 0.2}
          transparent
          opacity={0.8}
        />
      </Sphere>
      <Text
        position={[0, -1, 0]}
        fontSize={0.3}
        color={node.color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/orbitron.woff"
      >
        {node.label}
      </Text>
    </group>
  );
};

const NetworkConnection: React.FC<{ 
  connection: NetworkConnection; 
  nodes: NetworkNode[];
  isActive: boolean;
}> = ({ connection, nodes, isActive }) => {
  const fromNode = nodes.find(n => n.id === connection.from);
  const toNode = nodes.find(n => n.id === connection.to);

  if (!fromNode || !toNode) return null;

  const points = [
    new THREE.Vector3(...fromNode.position),
    new THREE.Vector3(...toNode.position),
  ];

  return (
    <Line
      points={points}
      color={connection.color}
      lineWidth={isActive ? 3 : 1}
      transparent
      opacity={isActive ? 0.8 : 0.4}
    />
  );
};

const NetworkVisualization: React.FC<{ className?: string }> = ({ className }) => {
  const nodes: NetworkNode[] = useMemo(() => [
    { id: 'ethereum', position: [-4, 2, 0], color: '#627eea', label: 'Ethereum' },
    { id: 'arbitrum', position: [4, 2, 0], color: '#28a0f0', label: 'Arbitrum' },
    { id: 'polygon', position: [-4, -2, 0], color: '#8247e5', label: 'Polygon' },
    { id: 'avalanche', position: [0, 0, 0], color: '#e84142', label: 'Avalanche' },
    { id: 'optimism', position: [4, -2, 0], color: '#ff0420', label: 'Optimism' },
  ], []);

  const connections: NetworkConnection[] = useMemo(() => [
    { from: 'avalanche', to: 'ethereum', color: '#06b6d4' },
    { from: 'avalanche', to: 'arbitrum', color: '#06b6d4' },
    { from: 'avalanche', to: 'polygon', color: '#06b6d4' },
    { from: 'avalanche', to: 'optimism', color: '#06b6d4' },
  ], []);

  const [activeNode, setActiveNode] = React.useState<string>('avalanche');

  React.useEffect(() => {
    const interval = setInterval(() => {
      const nodeIds = nodes.map(n => n.id);
      const currentIndex = nodeIds.indexOf(activeNode);
      const nextIndex = (currentIndex + 1) % nodeIds.length;
      setActiveNode(nodeIds[nextIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeNode, nodes]);

  return (
    <div className={`w-full h-96 ${className}`}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />
        
        {nodes.map((node) => (
          <NetworkNode
            key={node.id}
            node={node}
            isActive={activeNode === node.id}
          />
        ))}
        
        {connections.map((connection, index) => (
          <NetworkConnection
            key={index}
            connection={connection}
            nodes={nodes}
            isActive={activeNode === connection.from || activeNode === connection.to}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default NetworkVisualization;