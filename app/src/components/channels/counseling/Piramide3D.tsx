"use client";

import { useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";

/**
 * El triángulo de Counseling en 3D: una pirámide cortada en las mismas tres
 * franjas del logo (oro, cielo y azul).
 *
 * Al cargar, las franjas caen y se arman. Después la escena la mueve el
 * scroll de la portada (`estado`): la pirámide sale del hueco entre las dos
 * palabras del nombre, crece al centro y se abre en franjas para dejar ver
 * la frase que sigue. Es la transformación de la portada.
 */

export type EstadoPortada = {
  /** 0→1: del hueco del nombre al centro, creciendo. */
  a: number;
  /** 0→1: las franjas se separan. */
  b: number;
  /** 0→1: las franjas salen de cuadro y la escena se apaga. */
  c: number;
  /** Ratón, de −1 a 1. */
  mx: number;
  my: number;
};

const ALTO = 2;
const RADIO = 1.3;
/** Las franjas del logo, en las unidades de su viewBox (alto 104). */
const FRANJAS = [
  { de: 0, a: 33, color: "#d4a24c" },
  { de: 40, a: 65, color: "#5fa0c8" },
  { de: 72, a: 104, color: "#2b86b3" },
] as const;

const lim = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => x * x * (3 - 2 * x);
const rebote = (x: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;

function Piramide({
  estado,
  hueco,
  quieto,
}: {
  estado: RefObject<EstadoPortada>;
  hueco: RefObject<HTMLElement | null>;
  quieto: boolean;
}) {
  const grupo = useRef<Group>(null);
  const franjas = useRef<(Mesh | null)[]>([]);
  const materiales = useRef<(MeshStandardMaterial | null)[]>([]);
  const inicio = useRef<number | null>(null);

  useFrame((state) => {
    const g = grupo.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (inicio.current == null) inicio.current = t;
    const vivo = t - inicio.current;
    const { a, b, c, mx, my } = estado.current ?? { a: 0, b: 0, c: 0, mx: 0, my: 0 };

    // Dónde está el hueco del nombre, en unidades del mundo.
    const lienzo = state.gl.domElement.getBoundingClientRect();
    const { width: an, height: al } = state.viewport;
    let x0 = 0;
    let y0 = 0;
    let e0 = (al * 0.22) / ALTO;
    const caja = hueco.current?.getBoundingClientRect();
    if (caja && caja.height > 0 && lienzo.height > 0) {
      x0 = ((caja.left + caja.width / 2 - lienzo.left) / lienzo.width - 0.5) * an;
      y0 = -((caja.top + caja.height / 2 - lienzo.top) / lienzo.height - 0.5) * al;
      e0 = ((caja.height / lienzo.height) * al) / ALTO;
    }
    const k = suave(a);
    const grande = (al * 0.6) / ALTO;
    g.position.set(mezcla(x0, 0, k), mezcla(y0, -al * 0.02, k), 0);
    g.scale.setScalar(mezcla(e0, grande, k) * (1 + c * 0.35));

    const giro = quieto ? 0.6 : vivo * 0.32;
    g.rotation.y = giro + a * Math.PI * 1.1 + mx * 0.35;
    g.rotation.x = 0.16 + my * 0.18 - b * 0.12;

    FRANJAS.forEach((_, i) => {
      const m = franjas.current[i];
      if (!m) return;
      // Entrada: cada franja cae desde arriba, una tras otra.
      const entra = quieto ? 1 : rebote(lim((vivo - 0.15 - i * 0.16) / 0.9));
      const caida = (1 - entra) * (3.2 + i * 0.6);
      // Apertura: la de arriba sube, la de abajo baja y la de en medio se
      // va de lado girando, para dejar libre el centro donde aparece la frase.
      const lado = 1 - i;
      const sb = suave(b);
      if (i === 1) {
        m.position.y = m.userData.y + caida - sb * 0.4;
        m.position.x = sb * 2.6 + c * 2;
        m.position.z = -sb * 1.5;
        m.rotation.z = -sb * 0.9;
      } else {
        m.position.y = m.userData.y + caida + lado * (sb * 1.35 + c * 2.4);
        m.position.x = lado * -0.35 * sb;
        m.rotation.z = lado * 0.22 * sb;
      }
      m.rotation.y = Math.PI / 4 + (i - 1) * 0.35 * sb;
      const mat = materiales.current[i];
      const sale = i === 1 ? sb * 0.85 : 0;
      if (mat) mat.opacity = lim(entra * 1.4) * (1 - suave(c)) * (1 - sale);
    });
  });

  return (
    <group ref={grupo}>
      {FRANJAS.map((f, i) => {
        const yArriba = ALTO / 2 - (f.de / 104) * ALTO;
        const yAbajo = ALTO / 2 - (f.a / 104) * ALTO;
        const rArriba = (RADIO * f.de) / 104;
        const rAbajo = (RADIO * f.a) / 104;
        const y = (yArriba + yAbajo) / 2;
        return (
          <mesh
            key={f.color}
            ref={(m) => {
              franjas.current[i] = m;
              if (m) m.userData.y = y;
            }}
            position={[0, y, 0]}
            rotation={[0, Math.PI / 4, 0]}
          >
            <cylinderGeometry args={[rArriba, rAbajo, yArriba - yAbajo, 4, 1]} />
            <meshStandardMaterial
              ref={(mat) => {
                materiales.current[i] = mat;
              }}
              color={f.color}
              metalness={0.28}
              roughness={0.32}
              flatShading
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Piramide3D({
  estado,
  hueco,
  activo,
  quieto,
  alListo,
}: {
  estado: RefObject<EstadoPortada>;
  hueco: RefObject<HTMLElement | null>;
  /** Fuera de pantalla no se dibuja: ahorra batería. */
  activo: boolean;
  /** Menos movimiento: sin caída ni giro continuo. */
  quieto: boolean;
  alListo?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 32 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      frameloop={activo ? "always" : "never"}
      onCreated={() => alListo?.()}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <directionalLight position={[-4, -1, 2]} intensity={0.7} color="#9cc6e6" />
      <pointLight position={[0, -2.2, 3]} intensity={8} distance={10} color="#e8b65c" />
      <Piramide estado={estado} hueco={hueco} quieto={quieto} />
    </Canvas>
  );
}
