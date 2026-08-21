"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import type { Group, Points } from "three";
import * as THREE from "three";
import styles from "./consultorio.module.css";

function ParticleField() {
  const ref = useRef<Points>(null);
  const geometry = useMemo(() => {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.06;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.028} color="#93c5fd" transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

function OrbitRing({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * speed;
  });

  const dots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return [Math.cos(a) * radius, Math.sin(a) * radius, 0] as [number, number, number];
    });
  }, [radius]);

  return (
    <group ref={ref}>
      {dots.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingShapes() {
  return (
    <>
      <Float speed={1.4} rotationIntensity={0.55} floatIntensity={0.9}>
        <mesh position={[-1.35, 0.55, -0.5]} rotation={[0.4, 0.6, 0.2]}>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshStandardMaterial color="#2d6a9f" wireframe emissive="#1e4a6f" emissiveIntensity={0.35} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.7} floatIntensity={1.1}>
        <mesh position={[1.25, -0.35, -0.8]} rotation={[0.8, 0.2, 0.5]}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color="#c9a227" wireframe emissive="#92710a" emissiveIntensity={0.25} />
        </mesh>
      </Float>
      <Float speed={1.2} rotationIntensity={0.35} floatIntensity={0.65}>
        <mesh position={[0.15, 1.05, -1.2]} rotation={[0.2, 0.9, 0.1]}>
          <torusGeometry args={[0.38, 0.06, 12, 32]} />
          <meshStandardMaterial color="#93c5fd" emissive="#2d6a9f" emissiveIntensity={0.2} metalness={0.6} roughness={0.35} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.45} floatIntensity={0.75}>
        <mesh position={[-0.9, -0.85, -0.3]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial color="#1e4a6f" wireframe transparent opacity={0.5} />
        </mesh>
      </Float>
    </>
  );
}

function Scene() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 4]} intensity={1.1} color="#93c5fd" />
      <pointLight position={[-3, -2, 3]} intensity={0.65} color="#c9a227" />
      <ParticleField />
      <OrbitRing radius={1.55} color="#2d6a9f" speed={0.12} />
      <OrbitRing radius={2.05} color="#c9a227" speed={-0.08} />
      <FloatingShapes />
      <Sparkles count={55} scale={[5, 3.5, 2]} size={1.8} speed={0.35} opacity={0.45} color="#fde68a" />
    </group>
  );
}

export function HeroThreeBackground() {
  return (
    <div className={styles.heroThree} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 48 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
