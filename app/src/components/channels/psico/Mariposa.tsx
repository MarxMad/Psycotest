"use client";

import { forwardRef, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Mariposa de barro: el símbolo de la psique (en griego, ψυχή es a la vez
 * «alma» y «mariposa»). Dos alas que aletean sobre el eje del cuerpo.
 */

function formaAla(): THREE.Shape {
  const ala = new THREE.Shape();
  ala.moveTo(0, 0.02);
  ala.bezierCurveTo(0.18, 0.55, 0.92, 0.82, 1.02, 0.38);
  ala.bezierCurveTo(1.08, 0.1, 0.66, 0.02, 0.32, -0.02);
  ala.bezierCurveTo(0.78, -0.16, 0.82, -0.66, 0.46, -0.74);
  ala.bezierCurveTo(0.2, -0.78, 0.04, -0.36, 0, -0.04);
  return ala;
}

let geometriaAla: THREE.ShapeGeometry | null = null;
function alaCompartida() {
  if (!geometriaAla) geometriaAla = new THREE.ShapeGeometry(formaAla(), 24);
  return geometriaAla;
}

type Props = {
  color: string;
  /** Color de las manchas del borde. */
  borde?: string;
  escala?: number;
  /** Aleteos por segundo, aprox. */
  ritmo?: number;
  /** Desfase para que varias mariposas no aleteen al unísono. */
  fase?: number;
  sombras?: boolean;
} & Omit<ThreeElements["group"], "ref">;

export const Mariposa = forwardRef<THREE.Group, Props>(function Mariposa(
  { color, borde = "#2a2236", escala = 0.35, ritmo = 2.2, fase = 0, sombras = false, ...resto },
  ref,
) {
  const izquierda = useRef<THREE.Group>(null);
  const derecha = useRef<THREE.Group>(null);

  const materiales = useMemo(
    () => ({
      ala: new THREE.MeshStandardMaterial({ color, roughness: 0.75, side: THREE.DoubleSide }),
      borde: new THREE.MeshStandardMaterial({ color: borde, roughness: 0.8, side: THREE.DoubleSide }),
      cuerpo: new THREE.MeshStandardMaterial({ color: "#2b2420", roughness: 0.9 }),
    }),
    [color, borde],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * ritmo * Math.PI * 2 + fase;
    // Bajan rápido y suben lento: así se lee como aleteo y no como bisagra.
    const a = 0.25 + Math.pow((Math.sin(t) + 1) / 2, 0.7) * 1.15;
    if (izquierda.current) izquierda.current.rotation.y = a;
    if (derecha.current) derecha.current.rotation.y = -a;
  });

  const geo = alaCompartida();

  return (
    <group ref={ref} scale={escala} {...resto}>
      <mesh material={materiales.cuerpo} castShadow={sombras}>
        <capsuleGeometry args={[0.07, 0.62, 6, 12]} />
      </mesh>
      {/* Antenas */}
      <mesh material={materiales.cuerpo} position={[0.08, 0.5, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 6]} />
      </mesh>
      <mesh material={materiales.cuerpo} position={[-0.08, 0.5, 0]} rotation={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 6]} />
      </mesh>

      <group ref={derecha}>
        <mesh geometry={geo} material={materiales.ala} position={[0.03, 0.05, 0]} castShadow={sombras} />
        <mesh material={materiales.borde} position={[0.82, 0.42, 0.004]}>
          <circleGeometry args={[0.1, 16]} />
        </mesh>
      </group>
      <group ref={izquierda} scale={[-1, 1, 1]}>
        <mesh geometry={geo} material={materiales.ala} position={[0.03, 0.05, 0]} castShadow={sombras} />
        <mesh material={materiales.borde} position={[0.82, 0.42, 0.004]}>
          <circleGeometry args={[0.1, 16]} />
        </mesh>
      </group>
    </group>
  );
});
