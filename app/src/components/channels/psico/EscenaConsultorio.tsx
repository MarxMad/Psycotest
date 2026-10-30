"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Mariposa } from "./Mariposa";

/**
 * La portada: un aula-consultorio de barro con luz de mañana.
 *
 * Todo es geometría hecha aquí —sin modelos ni texturas que descargar— para
 * que cargue rápido y no dependa de nadie. El sol entra por detrás de los
 * ventanales; su sombra recorta los arcos sobre el piso y esa luz es la que
 * da la sensación de calma. Al centro, una Ψ de barro que flota y mira al
 * cursor; alrededor, mariposas (ψυχή: alma y mariposa).
 */

const C = {
  fondo: "#efe7da",
  muro: "#f1e7d6",
  piso: "#d8bf9b",
  barro: "#f7eedf",
  madera: "#c7a27a",
  maderaOscura: "#a07c56",
  pizarra: "#2e4a40",
  salvia: "#9fbaa4",
  salviaOscura: "#6f9479",
  lavanda: "#bba8da",
  mostaza: "#e9c75e",
  terracota: "#d48d6a",
  cielo: "#cfe0ee",
};

/** Ventanales: centro, ancho y alto (el arco va incluido en el alto). */
const VENTANAS = [
  { x: -4.3, ancho: 2.2, alto: 3.9 },
  { x: 0, ancho: 2.8, alto: 4.5 },
  { x: 4.3, ancho: 2.2, alto: 3.9 },
];
const BASE_VENTANA = 1.0;
const MURO_Z = -3;
/** Hacia dónde viaja la luz del sol. */
const SOL = new THREE.Vector3(3, 9, -12);
const DIRECCION_SOL = SOL.clone().negate().normalize();

/* ------------------------------------------------------------- cielo */

function Cielo() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          arriba: { value: new THREE.Color("#a8cbe7") },
          abajo: { value: new THREE.Color("#f4f1ea") },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 arriba;
          uniform vec3 abajo;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(mix(abajo, arriba, smoothstep(0.2, 0.9, vUv.y)), 1.0);
            #include <colorspace_fragment>
          }`,
        depthWrite: false,
      }),
    [],
  );
  return (
    <mesh position={[0, 4, -10]} material={material}>
      <planeGeometry args={[46, 22]} />
    </mesh>
  );
}

const BOLAS_NUBE: [number, number, number][] = [
  [0, 0, 1],
  [0.95, 0.12, 0.78],
  [-0.92, 0.08, 0.74],
  [0.42, 0.58, 0.72],
  [-0.38, 0.52, 0.66],
  [1.7, -0.1, 0.52],
  [-1.65, -0.08, 0.5],
];

function Nube({ x, y, z, escala, velocidad }: { x: number; y: number; z: number; escala: number; velocidad: number }) {
  const ref = useRef<THREE.Group>(null);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.55, roughness: 1 }),
    [],
  );
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x += velocidad * dt;
    if (g.position.x > 14) g.position.x = -14;
  });
  return (
    <group ref={ref} position={[x, y, z]} scale={escala}>
      {BOLAS_NUBE.map(([bx, by, r], i) => (
        <mesh key={i} position={[bx, by, 0]} material={material}>
          <sphereGeometry args={[r, 20, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/* --------------------------------------------------- muro y ventanas */

function geometriaMuro() {
  const ancho = 20;
  const alto = 9;
  const muro = new THREE.Shape();
  muro.moveTo(-ancho / 2, 0);
  muro.lineTo(ancho / 2, 0);
  muro.lineTo(ancho / 2, alto);
  muro.lineTo(-ancho / 2, alto);
  muro.closePath();

  for (const v of VENTANAS) {
    const r = v.ancho / 2;
    const hueco = new THREE.Path();
    hueco.moveTo(v.x - r, BASE_VENTANA);
    hueco.lineTo(v.x + r, BASE_VENTANA);
    hueco.lineTo(v.x + r, BASE_VENTANA + v.alto - r);
    hueco.absarc(v.x, BASE_VENTANA + v.alto - r, r, 0, Math.PI, false);
    hueco.lineTo(v.x - r, BASE_VENTANA);
    muro.holes.push(hueco);
  }

  return new THREE.ExtrudeGeometry(muro, { depth: 0.4, bevelEnabled: false, curveSegments: 40 });
}

function Ventanal({ x, ancho, alto }: { x: number; ancho: number; alto: number }) {
  const r = ancho / 2;
  const z = MURO_Z - 0.18;
  return (
    <group>
      {/* Parteluz y travesaños */}
      <mesh position={[x, BASE_VENTANA + alto / 2, z]} castShadow>
        <boxGeometry args={[0.07, alto, 0.07]} />
        <meshStandardMaterial color={C.madera} roughness={0.8} />
      </mesh>
      {[0.36, 0.64].map((f) => (
        <mesh key={f} position={[x, BASE_VENTANA + alto * f, z]} castShadow>
          <boxGeometry args={[ancho, 0.07, 0.07]} />
          <meshStandardMaterial color={C.madera} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[x, BASE_VENTANA + alto - r, z]} castShadow>
        <torusGeometry args={[r - 0.04, 0.05, 8, 48, Math.PI]} />
        <meshStandardMaterial color={C.madera} roughness={0.8} />
      </mesh>
      {/* Repisa */}
      <mesh position={[x, BASE_VENTANA - 0.06, MURO_Z + 0.12]} receiveShadow castShadow>
        <boxGeometry args={[ancho + 0.36, 0.12, 0.5]} />
        <meshStandardMaterial color={C.barro} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Muro() {
  const geometria = useMemo(geometriaMuro, []);
  return (
    <group>
      <mesh geometry={geometria} position={[0, 0, MURO_Z - 0.4]} castShadow receiveShadow>
        <meshStandardMaterial color={C.muro} roughness={0.95} />
      </mesh>
      {/* Zoclo */}
      <mesh position={[0, 0.13, MURO_Z + 0.04]} receiveShadow>
        <boxGeometry args={[20, 0.26, 0.08]} />
        <meshStandardMaterial color={C.barro} roughness={0.9} />
      </mesh>
      {VENTANAS.map((v) => (
        <Ventanal key={v.x} {...v} />
      ))}
    </group>
  );
}

/* --------------------------------------------------------------- piso */

function texturaDuela() {
  const lienzo = document.createElement("canvas");
  lienzo.width = 512;
  lienzo.height = 512;
  const ctx = lienzo.getContext("2d")!;
  ctx.fillStyle = C.piso;
  ctx.fillRect(0, 0, 512, 512);
  // Duelas con un leve cambio de tono, como madera natural.
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `rgba(120, 84, 48, ${0.03 + (i % 3) * 0.02})`;
    ctx.fillRect(0, i * 64, 512, 64);
    ctx.fillStyle = "rgba(110, 76, 44, 0.18)";
    ctx.fillRect(0, i * 64, 512, 2);
    const corte = ((i * 197) % 512) | 0;
    ctx.fillRect(corte, i * 64, 2, 64);
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(5, 4);
  textura.anisotropy = 4;
  return textura;
}

function Piso() {
  const mapa = useMemo(texturaDuela, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]} receiveShadow>
      <planeGeometry args={[40, 16]} />
      <meshStandardMaterial map={mapa} roughness={0.85} />
    </mesh>
  );
}

/* ------------------------------------------------------- haz de luz */

function HacesDeLuz() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { color: { value: new THREE.Color("#fff3d6") } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 color;
          varying vec2 vUv;
          void main() {
            float largo = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
            float ancho = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
            gl_FragColor = vec4(color * largo * ancho * 0.16, 1.0);
          }`,
      }),
    [],
  );

  const haces = useMemo(() => {
    const giro = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIRECCION_SOL.clone().negate());
    return VENTANAS.map((v) => {
      const largo = 7;
      const inicio = new THREE.Vector3(v.x, BASE_VENTANA + v.alto * 0.5, MURO_Z);
      const centro = inicio.clone().addScaledVector(DIRECCION_SOL, largo / 2);
      return { centro, giro, ancho: v.ancho * 0.95, largo };
    });
  }, []);

  return (
    <group>
      {haces.map((h, i) => (
        <mesh key={i} position={h.centro} quaternion={h.giro} material={material}>
          <planeGeometry args={[h.ancho, h.largo]} />
        </mesh>
      ))}
    </group>
  );
}

function Polvo({ cuantos }: { cuantos: number }) {
  const ref = useRef<THREE.Points>(null);
  const posiciones = useMemo(() => {
    const p = new Float32Array(cuantos * 3);
    for (let i = 0; i < cuantos; i++) {
      p[i * 3] = (Math.random() - 0.5) * 9;
      p[i * 3 + 1] = Math.random() * 5;
      p[i * 3 + 2] = -2.6 + Math.random() * 4;
    }
    return p;
  }, [cuantos]);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.08;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.12;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#fff6e0" size={0.035} transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}

/* ----------------------------------------------------------------- Ψ */

function geometriasPsi() {
  const opciones: THREE.ExtrudeGeometryOptions = {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.17,
    bevelSize: 0.13,
    bevelSegments: 10,
    curveSegments: 48,
  };
  const ro = 0.92;
  const ri = 0.55;
  const cy = 0.24;
  const tope = 1.06;

  const copa = new THREE.Shape();
  copa.moveTo(-ro, tope);
  copa.lineTo(-ro, cy);
  copa.absarc(0, cy, ro, Math.PI, Math.PI * 2, false);
  copa.lineTo(ro, tope);
  copa.lineTo(ri, tope);
  copa.lineTo(ri, cy);
  copa.absarc(0, cy, ri, 0, Math.PI, true);
  copa.lineTo(-ri, tope);
  copa.closePath();

  const rect = (x: number, y: number, w: number, h: number) => {
    const s = new THREE.Shape();
    s.moveTo(x, y);
    s.lineTo(x + w, y);
    s.lineTo(x + w, y + h);
    s.lineTo(x, y + h);
    s.closePath();
    return s;
  };

  return [copa, rect(-0.17, -1.1, 0.34, 2.4), rect(-0.5, -1.22, 1, 0.2)].map((forma) => {
    const g = new THREE.ExtrudeGeometry(forma, opciones);
    g.translate(0, 0, -0.15);
    return g;
  });
}

function Psi() {
  const grupo = useRef<THREE.Group>(null);
  const geometrias = useMemo(geometriasPsi, []);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: C.barro,
        roughness: 0.62,
        sheen: 1,
        sheenColor: new THREE.Color("#fff3e2"),
        sheenRoughness: 0.5,
      }),
    [],
  );

  useFrame(({ clock, pointer }, dt) => {
    const g = grupo.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const suave = 1 - Math.exp(-dt * 2.5);
    g.position.y = 2.82 + Math.sin(t * 0.9) * 0.07;
    g.rotation.y += (pointer.x * 0.45 + Math.sin(t * 0.35) * 0.1 - g.rotation.y) * suave;
    g.rotation.x += (-pointer.y * 0.12 - g.rotation.x) * suave;
    g.rotation.z = Math.sin(t * 0.6) * 0.025;
  });

  return (
    <group ref={grupo} position={[0, 2.82, -0.4]} scale={0.8}>
      {geometrias.map((g, i) => (
        <mesh key={i} geometry={g} material={material} castShadow receiveShadow />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------- mobiliario */

function Pedestal() {
  return (
    <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.06} smoothness={4} position={[0, 0.75, -0.4]} castShadow receiveShadow>
      <meshStandardMaterial color={C.barro} roughness={0.9} />
    </RoundedBox>
  );
}

function texturaPizarra() {
  const lienzo = document.createElement("canvas");
  lienzo.width = 1024;
  lienzo.height = 720;
  const ctx = lienzo.getContext("2d")!;
  ctx.fillStyle = C.pizarra;
  ctx.fillRect(0, 0, 1024, 720);
  // Restos de borrador
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, Math.random() * 720, 80 + Math.random() * 120, 30 + Math.random() * 40, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(245,242,232,0.85)";
  ctx.fillStyle = "rgba(245,242,232,0.9)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Un radar de cinco ejes: la lectura conjunta de la batería.
  const cx = 300;
  const cy = 380;
  const radio = 200;
  const vertice = (i: number, f: number) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    return [cx + Math.cos(a) * radio * f, cy + Math.sin(a) * radio * f] as const;
  };
  for (const f of [0.33, 0.66, 1]) {
    ctx.globalAlpha = f === 1 ? 0.75 : 0.35;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const [x, y] = vertice(i % 5, f);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(242,214,75,0.95)";
  ctx.lineWidth = 6;
  const perfil = [0.85, 0.6, 0.78, 0.45, 0.7];
  ctx.beginPath();
  perfil.forEach((f, i) => {
    const [x, y] = vertice(i, f);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();

  ctx.font = "italic 600 120px Georgia, serif";
  ctx.fillText("Ψ", 640, 230);
  ctx.font = "italic 44px Georgia, serif";
  ctx.fillText("1. códigos", 620, 360);
  ctx.fillText("2. aplicación", 620, 440);
  ctx.fillText("3. informe", 620, 520);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(245,242,232,0.7)";
  ctx.beginPath();
  ctx.moveTo(620, 560);
  ctx.quadraticCurveTo(760, 585, 900, 556);
  ctx.stroke();

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

function Pizarra() {
  const mapa = useMemo(texturaPizarra, []);
  return (
    <group position={[-3.5, 0, 0.5]} rotation={[0, 0.42, 0]}>
      <RoundedBox args={[2.3, 1.62, 0.1]} radius={0.04} position={[0, 2.05, 0]} rotation={[-0.08, 0, 0]} castShadow>
        <meshStandardMaterial color={C.madera} roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 2.05, 0.056]} rotation={[-0.08, 0, 0]}>
        <planeGeometry args={[2.12, 1.44]} />
        <meshStandardMaterial map={mapa} roughness={0.95} />
      </mesh>
      {/* Caballete */}
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 1.35, 0.12]} rotation={[-0.1, 0, x > 0 ? -0.06 : 0.06]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 2.75, 10]} />
          <meshStandardMaterial color={C.maderaOscura} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, -0.45]} rotation={[0.32, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 2.7, 10]} />
        <meshStandardMaterial color={C.maderaOscura} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0.14]} castShadow>
        <boxGeometry args={[1.9, 0.07, 0.16]} />
        <meshStandardMaterial color={C.maderaOscura} roughness={0.8} />
      </mesh>
    </group>
  );
}

const LIBROS: { color: string; largo: number; alto: number; giro: number }[] = [
  { color: C.salvia, largo: 0.95, alto: 0.15, giro: 0.08 },
  { color: C.terracota, largo: 0.88, alto: 0.12, giro: -0.12 },
  { color: C.lavanda, largo: 0.8, alto: 0.17, giro: 0.2 },
  { color: C.mostaza, largo: 0.72, alto: 0.11, giro: -0.04 },
];

function PilaDeLibros({ position, rotacion = 0 }: { position: [number, number, number]; rotacion?: number }) {
  let y = 0;
  return (
    <group position={position} rotation={[0, rotacion, 0]}>
      {LIBROS.map((l, i) => {
        const centro = y + l.alto / 2;
        y += l.alto;
        return (
          <RoundedBox
            key={i}
            args={[l.largo, l.alto, 0.62]}
            radius={0.035}
            smoothness={3}
            position={[0, centro, 0]}
            rotation={[0, l.giro, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={l.color} roughness={0.85} />
          </RoundedBox>
        );
      })}
    </group>
  );
}

function Escritorio() {
  const patas: [number, number][] = [
    [-1.1, -0.45],
    [1.1, -0.45],
    [-1.1, 0.45],
    [1.1, 0.45],
  ];
  return (
    <group position={[3.5, 0, 0.3]} rotation={[0, -0.32, 0]}>
      <RoundedBox args={[2.6, 0.12, 1.15]} radius={0.04} position={[0, 1.02, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.madera} roughness={0.75} />
      </RoundedBox>
      {patas.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.48, z]} castShadow>
          <cylinderGeometry args={[0.045, 0.035, 0.96, 10]} />
          <meshStandardMaterial color={C.maderaOscura} roughness={0.8} />
        </mesh>
      ))}
      <PilaDeLibros position={[-0.55, 1.08, 0]} rotacion={0.2} />
      {/* Taza */}
      <mesh position={[0.55, 1.22, 0.1]} castShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.28, 24]} />
        <meshStandardMaterial color={C.barro} roughness={0.6} />
      </mesh>
      {/* Hojas de evaluación */}
      <mesh position={[0.2, 1.085, -0.15]} rotation={[-Math.PI / 2, 0, 0.25]} receiveShadow>
        <planeGeometry args={[0.5, 0.66]} />
        <meshStandardMaterial color="#fbf8f2" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Taburete() {
  return (
    <group position={[-2.5, 0, 0.7]}>
      <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.09, 28]} />
        <meshStandardMaterial color={C.madera} roughness={0.75} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i * Math.PI * 2) / 3;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.2, 0.46, Math.sin(a) * 0.2]}
            rotation={[Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14]}
            castShadow
          >
            <cylinderGeometry args={[0.03, 0.04, 0.95, 8]} />
            <meshStandardMaterial color={C.maderaOscura} roughness={0.8} />
          </mesh>
        );
      })}
      <PilaDeLibros position={[0, 1.0, 0]} rotacion={-0.5} />
    </group>
  );
}

function Planta() {
  const hojas = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = i * 2.4;
        const alto = 0.9 + (i % 4) * 0.28;
        return { a, alto, r: 0.18 + (i % 3) * 0.06 };
      }),
    [],
  );
  return (
    <group position={[5.4, 0, -1.7]}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.34, 0.72, 28]} />
        <meshStandardMaterial color={C.terracota} roughness={0.85} />
      </mesh>
      {hojas.map((h, i) => (
        <mesh
          key={i}
          position={[Math.cos(h.a) * 0.22, h.alto, Math.sin(h.a) * 0.22]}
          rotation={[Math.sin(h.a) * 0.5, h.a, Math.cos(h.a) * 0.5]}
          scale={[h.r * 1.1, h.r * 2.2, h.r * 0.45]}
          castShadow
        >
          <sphereGeometry args={[1, 18, 14]} />
          <meshStandardMaterial color={i % 2 ? C.salvia : C.salviaOscura} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Bloques de aprender: lo pedagógico, dicho sin letras. */
function Bloques() {
  const bloques: { pos: [number, number, number]; giro: number; color: string }[] = [
    { pos: [0, 0.23, 0], giro: 0.2, color: C.lavanda },
    { pos: [0.5, 0.23, 0.1], giro: -0.15, color: C.mostaza },
    { pos: [0.24, 0.69, 0.05], giro: 0.5, color: C.salvia },
  ];
  return (
    <group position={[1.9, 0, 0.9]}>
      {bloques.map((b, i) => (
        <RoundedBox key={i} args={[0.46, 0.46, 0.46]} radius={0.07} smoothness={4} position={b.pos} rotation={[0, b.giro, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={b.color} roughness={0.7} />
        </RoundedBox>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------- mariposas */

const VUELOS = [
  { color: C.lavanda, borde: "#4b3a78", radio: 1.9, alto: 3.4, velocidad: 0.45, fase: 0 },
  { color: C.mostaza, borde: "#7a5a12", radio: 2.5, alto: 2.4, velocidad: -0.32, fase: 2.1 },
  { color: "#f2b7a0", borde: "#8a3f22", radio: 3.2, alto: 4.0, velocidad: 0.26, fase: 4.2 },
];

function MariposaEnVuelo({ color, borde, radio, alto, velocidad, fase }: (typeof VUELOS)[number]) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime * velocidad + fase;
    const x = Math.cos(t) * radio;
    const z = -0.4 + Math.sin(t) * radio * 0.55;
    const y = alto + Math.sin(t * 2.3) * 0.3;
    g.position.set(x, y, z);
    // Mira hacia donde va.
    const dx = -Math.sin(t) * radio * Math.sign(velocidad);
    const dz = Math.cos(t) * radio * 0.55 * Math.sign(velocidad);
    g.rotation.set(-0.9, Math.atan2(dx, dz), 0);
  });
  return <Mariposa ref={ref} color={color} borde={borde} escala={0.32} ritmo={2.4} fase={fase} sombras />;
}

/* ---------------------------------------------------------------- cámara */

function Camara() {
  const destino = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, pointer, size }, dt) => {
    // En vertical (teléfono) se aleja: si no, la Ψ llena la pantalla.
    const lejos = Math.max(0, 1 - size.width / size.height) * 7;
    const alto = typeof window === "undefined" ? 1 : window.innerHeight;
    const progreso = Math.min(1, Math.max(0, (typeof window === "undefined" ? 0 : window.scrollY) / alto));
    destino.set(pointer.x * 0.6, 2.7 + pointer.y * 0.25 + progreso * 0.4, 12.6 + lejos - progreso * 3.6);
    camera.position.lerp(destino, 1 - Math.exp(-dt * 3));
    camera.lookAt(0, 2.55 + progreso * 0.45, -1);
  });
  return null;
}

/* ----------------------------------------------------------------- lienzo */

export default function EscenaConsultorio({
  activa = true,
  ligera = false,
  quieta = false,
  onListo,
}: {
  /** Fuera de pantalla no se dibuja: ahorra batería. */
  activa?: boolean;
  /** Teléfonos y equipos modestos: menos sombra y menos partículas. */
  ligera?: boolean;
  /** Menos movimiento: un solo cuadro, sin animación. */
  quieta?: boolean;
  onListo?: () => void;
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={ligera ? [1, 1.5] : [1, 1.8]}
      frameloop={quieta ? "demand" : activa ? "always" : "never"}
      camera={{ position: [0, 2.7, 12.6], fov: 30, near: 0.1, far: 60 }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.05 }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 2.55, -1);
        requestAnimationFrame(() => onListo?.());
      }}
      aria-hidden
    >
      <color attach="background" args={[C.fondo]} />
      <fog attach="fog" args={[C.fondo, 18, 38]} />

      <hemisphereLight args={["#fff8ee", "#d6bf9c", 1.5]} />
      <ambientLight intensity={0.2} />
      <directionalLight
        position={SOL.toArray()}
        intensity={3.4}
        color="#fff0d2"
        castShadow
        shadow-mapSize={ligera ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {/* Luz de frente, cálida y sin sombra: el barro se ve cremoso y no gris. */}
      <directionalLight position={[-6, 7, 10]} intensity={1.35} color="#fff0dc" />

      <Cielo />
      <Nube x={-6} y={3.2} z={-7.5} escala={1.1} velocidad={0.12} />
      <Nube x={1} y={5.2} z={-8.5} escala={1.4} velocidad={0.08} />
      <Nube x={7} y={2.6} z={-7} escala={0.9} velocidad={0.1} />
      {!ligera && <Nube x={-11} y={5.6} z={-9} escala={1.3} velocidad={0.07} />}

      <Muro />
      <Piso />
      <HacesDeLuz />
      <Polvo cuantos={ligera ? 60 : 160} />

      <Pedestal />
      <Psi />
      <Pizarra />
      <Escritorio />
      <Taburete />
      <Planta />
      <Bloques />
      {VUELOS.slice(0, ligera ? 2 : 3).map((v) => (
        <MariposaEnVuelo key={v.fase} {...v} />
      ))}

      {!quieta && <Camara />}
    </Canvas>
  );
}
