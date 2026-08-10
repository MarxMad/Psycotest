"use client";

/**
 * Hoja de perfil del PAPI.
 *
 * Reproduce la lámina impresa: veinte radios en el sentido de las agujas del
 * reloj a partir de N, con la escala 0–9 del centro hacia afuera. De adentro
 * hacia afuera hay cuatro anillos — escala, letra del factor, título
 * descriptivo y banda con las siete dimensiones.
 */

import { ETIQUETA_PERFIL, GRUPOS, ORDEN_PERFIL, esRol, type Factor } from "@/lib/papi";

const CX = 405;
const CY = 405;

const R0 = 66; // radio del 0
const R9 = 196; // radio del 9
const R_LETRA = 218; // anillo de las letras
const R_TIT_INT = 236; // anillo de títulos
const R_TIT_EXT = 336;
const R_BANDA_INT = 340; // banda de dimensiones
const R_BANDA_EXT = 388;

const PASO = 360 / 20;
/** N arriba; el resto en el sentido de las agujas del reloj. */
const angulo = (i: number) => -90 + i * PASO;

const rad = (g: number) => (g * Math.PI) / 180;
const punto = (a: number, r: number) => ({
  x: CX + r * Math.cos(rad(a)),
  y: CY + r * Math.sin(rad(a)),
});

const radioDe = (p: number) => R0 + ((R9 - R0) * p) / 9;

function arco(a1: number, a2: number, r: number) {
  const p1 = punto(a1, r);
  const p2 = punto(a2, r);
  const largo = a2 - a1 > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largo} 1 ${p2.x} ${p2.y}`;
}

/** Parte un título en líneas de a lo sumo `max` caracteres. */
function envolver(texto: string, max = 19): string[] {
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    if (!actual) actual = p;
    else if ((actual + " " + p).length <= max) actual += " " + p;
    else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, 3);
}

export function PerfilPapi({
  puntajes,
  nombre,
  puesto,
  empresa,
  fecha,
}: {
  puntajes: Record<Factor, number>;
  nombre?: string;
  puesto?: string;
  empresa?: string;
  fecha?: string;
}) {
  const indice = new Map(ORDEN_PERFIL.map((f, i) => [f, i]));

  const vertices = ORDEN_PERFIL.map((f, i) => punto(angulo(i), radioDe(puntajes[f] ?? 0)));
  const poligono = vertices.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <figure className="perfilFig">
      {(nombre || puesto || empresa || fecha) && (
        <header className="perfilDatos">
          {nombre && (
            <div>
              <span>Nombre</span>
              <b>{nombre}</b>
            </div>
          )}
          {puesto && (
            <div>
              <span>Puesto</span>
              <b>{puesto}</b>
            </div>
          )}
          {empresa && (
            <div>
              <span>Empresa</span>
              <b>{empresa}</b>
            </div>
          )}
          {fecha && (
            <div>
              <span>Fecha</span>
              <b>{fecha}</b>
            </div>
          )}
        </header>
      )}

      <svg viewBox="0 0 810 810" role="img" aria-label="Hoja de perfil del PAPI">
        <title>Hoja de perfil del PAPI{nombre ? ` — ${nombre}` : ""}</title>

        {/* anillos de la escala 0…9 */}
        {Array.from({ length: 10 }, (_, p) => (
          <circle
            key={p}
            cx={CX}
            cy={CY}
            r={radioDe(p)}
            className={p === 0 || p === 9 ? "anilloFuerte" : "anillo"}
          />
        ))}

        {/* radios de la escala */}
        {ORDEN_PERFIL.map((f, i) => {
          const a = angulo(i);
          const d = punto(a, R0);
          const h = punto(a, R9);
          return <line key={f} x1={d.x} y1={d.y} x2={h.x} y2={h.y} className="radio" />;
        })}

        {/* anillo de títulos: celdas y divisiones */}
        <circle cx={CX} cy={CY} r={R_TIT_INT} className="anilloTit" />
        <circle cx={CX} cy={CY} r={R_TIT_EXT} className="anilloTit" />
        {ORDEN_PERFIL.map((_, i) => {
          const a = angulo(i) - PASO / 2;
          const d = punto(a, R_TIT_INT);
          const h = punto(a, R_TIT_EXT);
          return <line key={i} x1={d.x} y1={d.y} x2={h.x} y2={h.y} className="anilloTit" />;
        })}

        {/* banda exterior con las siete dimensiones */}
        {GRUPOS.map((g, gi) => {
          const idx = g.factores.map((f) => indice.get(f)!);
          const a1 = angulo(Math.min(...idx)) - PASO / 2 + 0.5;
          const a2 = angulo(Math.max(...idx)) + PASO / 2 - 0.5;
          const medio = (a1 + a2) / 2;
          const invertir = medio > 0 && medio < 180;
          const rTexto = invertir ? R_BANDA_INT + 10 : R_BANDA_EXT - 12;
          const p1i = punto(a1, R_BANDA_INT);
          const p1e = punto(a1, R_BANDA_EXT);
          const p2i = punto(a2, R_BANDA_INT);
          const p2e = punto(a2, R_BANDA_EXT);
          const largo = a2 - a1 > 180 ? 1 : 0;
          return (
            <g key={g.nombre}>
              <path
                className="banda"
                d={`M ${p1i.x} ${p1i.y} L ${p1e.x} ${p1e.y}
                    A ${R_BANDA_EXT} ${R_BANDA_EXT} 0 ${largo} 1 ${p2e.x} ${p2e.y}
                    L ${p2i.x} ${p2i.y}
                    A ${R_BANDA_INT} ${R_BANDA_INT} 0 ${largo} 0 ${p1i.x} ${p1i.y} Z`}
              />
              <path
                id={`papi-arco-${gi}`}
                d={invertir ? arco(a2, a1, rTexto) : arco(a1, a2, rTexto)}
                fill="none"
              />
              <text className="bandaTexto">
                <textPath href={`#papi-arco-${gi}`} startOffset="50%" textAnchor="middle">
                  {g.nombre.toUpperCase()}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* letra y título de cada factor */}
        {ORDEN_PERFIL.map((f, i) => {
          const a = angulo(i);
          const l = punto(a, R_LETRA);

          // El texto se lee siguiendo el radio; se voltea en la mitad
          // izquierda para que nunca quede de cabeza.
          const voltear = Math.cos(rad(a)) < -0.0001;
          const rAncla = voltear ? R_TIT_EXT - 7 : R_TIT_INT + 7;
          const p = punto(a, rAncla);
          const giro = voltear ? a + 180 : a;

          const lineas = envolver(ETIQUETA_PERFIL[f]);
          const dy0 = -((lineas.length - 1) * 4.6);

          return (
            <g key={f}>
              <text x={l.x} y={l.y} className={esRol(f) ? "letraRol" : "letraNec"}>
                {f}
              </text>
              <text
                className="titulo"
                transform={`rotate(${giro} ${p.x} ${p.y})`}
                x={p.x}
                y={p.y}
                textAnchor="start"
              >
                {lineas.map((linea, k) => (
                  <tspan key={linea} x={p.x} dy={k === 0 ? dy0 : 9.2}>
                    {linea}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* perfil trazado */}
        <polygon points={poligono} className="perfilArea" />
        <polygon points={poligono} className="perfilLinea" />
        {vertices.map((p, i) => (
          <circle key={ORDEN_PERFIL[i]} cx={p.x} cy={p.y} r={4} className="perfilPunto" />
        ))}

        {/* puntaje sobre cada radio */}
        {ORDEN_PERFIL.map((f, i) => {
          const p = punto(angulo(i), radioDe(puntajes[f] ?? 0) - 15);
          return (
            <text key={f} x={p.x} y={p.y} className="valor">
              {puntajes[f] ?? 0}
            </text>
          );
        })}

        <text x={CX} y={CY + 5} className="centroTitulo">
          PAPI
        </text>
      </svg>

      <figcaption>
        Radios en el sentido de las agujas del reloj a partir de <strong>N</strong>, con la escala
        0–9 del centro hacia afuera. Las <strong>necesidades</strong> se marcan en color y los{" "}
        <strong>roles</strong> en tinta.
      </figcaption>
    </figure>
  );
}
