"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mariposa } from "./Mariposa";

/**
 * Una mariposa que acompaña al cursor sobre los titulares grandes. Si el
 * cursor se va, vuelve a revolotear sola; al hacer clic suelta polen.
 *
 * El lienzo no recibe eventos (pointer-events: none): los escucha de la
 * sección que lo contiene, así el texto y los enlaces siguen funcionando.
 */

type Estado = {
  /** Cursor en coordenadas normalizadas de la sección (-1..1), o null si salió. */
  cursor: { x: number; y: number } | null;
  ultimoMovimiento: number;
  clic: { x: number; y: number; t: number } | null;
};

const POLEN = 14;

function Vuelo({ estado, color, borde }: { estado: RefObject<Estado>; color: string; borde: string }) {
  const mariposa = useRef<THREE.Group>(null);
  const polen = useRef<THREE.InstancedMesh>(null);
  const { size, camera } = useThree();
  const pos = useMemo(() => new THREE.Vector3(2.5, 0.5, 0), []);
  const vel = useMemo(() => new THREE.Vector3(), []);
  const destino = useMemo(() => new THREE.Vector3(), []);
  const particulas = useMemo(
    () => Array.from({ length: POLEN }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), vida: 0 })),
    [],
  );
  const ultimoClic = useRef(0);
  const auxiliar = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, dt) => {
    const g = mariposa.current;
    const e = estado.current;
    if (!g || !e) return;
    const t = clock.elapsedTime;
    const cam = camera as THREE.PerspectiveCamera;
    const medioAlto = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
    const medioAncho = medioAlto * (size.width / Math.max(1, size.height));

    const quieto = !e.cursor || performance.now() - e.ultimoMovimiento > 2600;
    if (quieto) {
      // Revoloteo propio, en un ocho amplio.
      destino.set(Math.sin(t * 0.35) * medioAncho * 0.6, Math.sin(t * 0.7) * medioAlto * 0.4, 0);
    } else {
      // Se queda un poco arriba y a la derecha del cursor: no lo tapa.
      destino.set(e.cursor!.x * medioAncho + 0.55, e.cursor!.y * medioAlto + 0.45, 0);
    }

    // Resorte amortiguado: llega, se pasa un poco y se acomoda.
    const fuerza = quieto ? 2.2 : 7;
    vel.addScaledVector(destino.clone().sub(pos), fuerza * dt);
    vel.multiplyScalar(Math.exp(-dt * 3.2));
    pos.addScaledVector(vel, dt * 2.2);

    g.position.set(pos.x, pos.y + Math.sin(t * 3.1) * 0.08, 0);
    g.rotation.set(-0.55, vel.x * 0.18, THREE.MathUtils.clamp(-vel.x * 0.12, -0.6, 0.6));

    // Polen al hacer clic.
    if (e.clic && e.clic.t !== ultimoClic.current) {
      ultimoClic.current = e.clic.t;
      const origen = new THREE.Vector3(e.clic.x * medioAncho, e.clic.y * medioAlto, 0);
      particulas.forEach((q, i) => {
        const a = (i / POLEN) * Math.PI * 2 + Math.random() * 0.4;
        const rapidez = 1.4 + Math.random() * 1.6;
        q.p.copy(origen);
        q.v.set(Math.cos(a) * rapidez, Math.sin(a) * rapidez + 0.8, 0);
        q.vida = 1;
      });
    }
    const malla = polen.current;
    if (malla) {
      particulas.forEach((q, i) => {
        if (q.vida > 0) {
          q.vida = Math.max(0, q.vida - dt * 1.3);
          q.v.y -= dt * 2.6;
          q.p.addScaledVector(q.v, dt);
        }
        auxiliar.position.copy(q.p);
        auxiliar.scale.setScalar(q.vida * 0.09);
        auxiliar.updateMatrix();
        malla.setMatrixAt(i, auxiliar.matrix);
      });
      malla.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <Mariposa ref={mariposa} color={color} borde={borde} escala={0.55} ritmo={2.6} />
      <instancedMesh ref={polen} args={[undefined, undefined, POLEN]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#f2d64b" emissive="#f2d64b" emissiveIntensity={0.4} roughness={0.6} />
      </instancedMesh>
    </>
  );
}

export default function MariposaCursor({
  zona,
  activa,
  color = "#bba8da",
  borde = "#4b3a78",
}: {
  zona: RefObject<HTMLElement | null>;
  activa: boolean;
  color?: string;
  borde?: string;
}) {
  const estado = useRef<Estado>({ cursor: null, ultimoMovimiento: 0, clic: null });

  useEffect(() => {
    const nodo = zona.current;
    if (!nodo) return;
    const normalizar = (e: PointerEvent) => {
      const r = nodo.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      estado.current.cursor = normalizar(e);
      estado.current.ultimoMovimiento = performance.now();
    };
    const salir = () => {
      estado.current.cursor = null;
    };
    const clic = (e: PointerEvent) => {
      // En los enlaces no se suelta polen: ahí el clic es para navegar.
      if ((e.target as HTMLElement).closest("a, button")) return;
      estado.current.clic = { ...normalizar(e), t: performance.now() };
    };
    nodo.addEventListener("pointermove", mover);
    nodo.addEventListener("pointerleave", salir);
    nodo.addEventListener("pointerdown", clic);
    return () => {
      nodo.removeEventListener("pointermove", mover);
      nodo.removeEventListener("pointerleave", salir);
      nodo.removeEventListener("pointerdown", clic);
    };
  }, [zona]);

  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={activa ? "always" : "never"}
      camera={{ position: [0, 0, 10], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
      aria-hidden
    >
      <hemisphereLight args={["#ffffff", "#d9c7a8", 1.6]} />
      <directionalLight position={[2, 4, 6]} intensity={1.6} />
      <Vuelo estado={estado} color={color} borde={borde} />
    </Canvas>
  );
}
