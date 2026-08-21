# Especificación de calificación — PAPI (Inventario de Preferencias de Personalidad)

Fuentes verificadas en este repositorio:

| Archivo | Qué aporta | Estado |
|---------|-----------|--------|
| `Cuestionario.docx` | 90 pares forzados A/B + instrucciones | ✅ extraído automáticamente (180 frases exactas) |
| `Tabla para evaluar.jpg` | Rejilla de calificación ítem → factor | ✅ estructura decodificada · ⚠️ clave celda-por-celda pendiente |
| `Prueba PAPI.docx` | Manual: 20 factores, interpretación, medias | ⏳ pendiente de vaciar a `interpretation_rules` |
| `Grafica PAPI.doc` | Plantilla del perfil | ⏳ pendiente de digitalizar bandas |

Convención de marcas en este documento: **✅ verificado** · **⚠️ hipótesis con prueba definida** · **❌ pendiente de terceros**.

---

## 1. Estructura del instrumento

### 1.1 Los 20 factores

Dos familias de 10, tal como aparecen en la rejilla:

| Fila superior — **Roles** (10) | Fila inferior — **Necesidades** (10) |
|---|---|
| **G** trabajador intenso | **N** necesidad de terminar la tarea |
| **L** rol de liderazgo | **A** necesidad de logro |
| **I** facilidad para decidir | **P** necesidad de controlar a otros |
| **T** ritmo / actividad | **X** necesidad de ser notado |
| **V** tipo vigoroso | **B** necesidad de pertenecer al grupo |
| **S** extensión social | **O** necesidad de relación cercana |
| **R** tipo teórico | **Z** necesidad de cambio |
| **D** interés por el detalle | **K** necesidad de ser enérgico |
| **C** tipo organizado | **F** necesidad de apoyar a la autoridad |
| **E** contención emocional | **W** necesidad de acatar normas |

El orden de las columnas en `Tabla para evaluar.jpg` es exactamente ese, y **cada columna alinea un rol con su necesidad correspondiente** (G–N, L–A, I–P, T–X, V–B, S–O, R–Z, D–K, C–F, E–W). Esas son las **díadas** que el manual usa para las asociaciones interpretativas.

### 1.2 Geometría de la rejilla ✅

La imagen es una cuadrícula de **9 columnas × 10 filas = 90 ítems**, con los números dispuestos así:

| | col 1 | col 2 | col 3 | col 4 | col 5 | col 6 | col 7 | col 8 | col 9 |
|---|---|---|---|---|---|---|---|---|---|
| fila 1 | 81 | 71 | 61 | 51 | 41 | 31 | 21 | 11 | 1 |
| fila 2 | 82 | 72 | 62 | 52 | 42 | 32 | 22 | 12 | 2 |
| … | … | … | … | … | … | … | … | … | … |
| fila 10 | 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 |

Encima hay **10 casillas de total** (roles) y debajo **10 casillas de total** (necesidades). Cada ítem tiene **dos flechas**: una que sube en diagonal hacia un factor-rol y otra que baja en diagonal hacia un factor-necesidad. Una **línea diagonal continua** cruza la rejilla de abajo-izquierda a arriba-derecha e invierte el sentido de las flechas (`←`/`↗` arriba de la línea, `→`/`↙` debajo).

### 1.3 Estructura real ✅ *(corregida)*

> **Corrección.** Una versión anterior de este documento suponía que cada ítem enfrentaba *un rol contra una necesidad*, excluyendo las díadas. **Es falso.** El procedimiento de corrección del manual, verificado después flecha por flecha contra la hoja de calificación, dice otra cosa.

La línea diagonal continua de la hoja separa dos mitades que **nunca se mezclan**:

> *"La hoja de respuestas está dividida en dos partes por una diagonal que la cruza desde el ángulo inferior izquierdo hasta el ángulo superior derecho. La puntuación que pudiera situarse a un lado de dicha diagonal no tiene nada que ver con la situada en el otro lado. Al determinar la puntuación, nunca se puede rebasar la diagonal."*
> — `Prueba PAPI.docx`, «EL PAPI: SU APLICACIÓN → 2. CORRECCIÓN»

De ahí la estructura verdadera:

| | |
|---|---|
| **45 ítems** | comparan **un rol contra otro rol** (mitad superior de la diagonal) |
| **45 ítems** | comparan **una necesidad contra otra necesidad** (mitad inferior) |
| Cada factor | participa en **9 flechas** — de ahí la escala 0–9 |
| Los 10 roles | suman siempre **45** |
| Las 10 necesidades | suman siempre **45** |

Ese doble total de 45 es el **control de cálculo** que el propio manual manda verificar, y solo puede ser constante si ningún ítem cruza la diagonal.

### 1.4 Derivación de la clave ✅

El manual describe el conteo de los tres primeros roles y de ahí se generaliza el patrón:

| Rol | Flechas horizontales | Flechas oblicuas | Total |
|-----|----------------------|------------------|:-----:|
| **G** | 1, 11, 21, 31, 41, 51, 61, 71, 81 | — | 9 |
| **L** | 12, 22, 32, 42, 52, 62, 72, 82 | 81 | 9 |
| **I** | 23, 33, 43, 53, 63, 73, 83 | 82, 71 | 9 |
| … | | | |
| **E** | — | 9 oblicuas | 9 |

Regla general para el rol en la posición *k*: las horizontales empiezan en **11k − 10** y avanzan de diez en diez hasta 90; las oblicuas son **k − 1**, empezando en **80 + (k−1)** y bajando de once en once.

La mitad de necesidades es la **rotación de 180°** de la de roles: el ítem *n* se corresponde con *91 − n*, y la posición *j* con la *11 − j*. Es decir **W espeja a G**, `F` a `L`, `K` a `I`, … y **N espeja a E**.

**Verificación visual.** Contadas las flechas de `Tabla para evaluar.jpg` fila por fila, el número de flechas izquierdas por fila es 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 — exactamente lo que predice la derivación, y suma 45. Las flechas derechas suman los otros 45.

**Asignación de opción:** la flecha **horizontal** está dibujada arriba del número y la **oblicua** debajo. El cuadernillo indica rodear *"la flecha superior"* para la primera frase, de modo que **horizontal = opción A** y **oblicua = opción B**.

---

## 2. Escala 0–9 ✅ (corrección importante al plan previo)

Como cada factor participa en **exactamente 9 ítems**, el conteo bruto de elecciones a favor de un factor cae naturalmente en **0…9**.

> **La escala 0–9 del PAPI no es una normalización ni requiere tabla de baremos: es el conteo crudo.**

El plan anterior reservaba horas para "convertir a escala 0–9 según fórmulas del manual y tablas de normalización". Eso **no es necesario para puntuar**. Las medias y bandas del manual sirven para **interpretar** el perfil (dónde cae el sujeto respecto a la referencia), no para calcular el puntaje.

Impacto: **M4 baja de riesgo y de horas**, y desaparece `norm_tables` como dependencia bloqueante para PAPI.

Verificación de suma: para todo protocolo completo,

```
Σ puntajes de los 20 factores = 90
Σ puntajes de los 10 roles    = 90 − Σ puntajes de las 10 necesidades
```

---

## 3. Motor de calificación

### 3.1 Contrato de datos de la clave

```jsonc
// app/src/data/papi-key.json
{
  "version": "1.1.0-derivada",
  "instrument": "PAPI",
  "roles": ["G","L","I","T","V","S","R","D","C","E"],
  "needs": ["N","A","P","X","B","O","Z","K","F","W"],
  "items": [
    { "n": 1,  "a": "G", "b": "E" },   // ítem de rol
    { "n": 2,  "a": "A", "b": "N" },   // ítem de necesidad
    { "n": 90, "a": "W", "b": "N" }
    // … 90 entradas
  ]
}
```

Algoritmo completo:

```ts
function scorePAPI(responses: Record<number, "A" | "B">, key: ScoringKey) {
  const scores = Object.fromEntries(FACTORS.map(f => [f, 0]));
  for (const item of key.items) {
    const choice = responses[item.n];              // "A" | "B"
    const factor = choice === "A" ? item.a.factor : item.b.factor;
    scores[factor] += 1;
  }
  return scores;                                    // cada valor ∈ 0..9
}
```

Es deliberadamente trivial. **Todo el riesgo del módulo está en la clave, no en el código** — por eso la clave se versiona como dato y se prueba, no se incrusta en el código.

### 3.2 Pruebas de integridad de la clave (bloquean el despliegue)

| # | Invariante | Qué error atrapa | Estado |
|---|-----------|------------------|:------:|
| **K1** | Los 90 ítems están presentes, sin huecos ni duplicados | Derivación incompleta | ✅ |
| **K2** | Cada uno de los 20 factores aparece **exactamente 9 veces** | Patrón mal generalizado | ✅ |
| **K3** | Ningún ítem cruza la diagonal: compara rol contra rol, o necesidad contra necesidad | Mitades mal separadas | ✅ |
| **K4** | Los 90 pares son distintos entre sí | Solapamiento de conjuntos | ✅ |
| **K5** | **45 ítems de rol y 45 de necesidad** — el control de 45 del manual | Diagonal desplazada | ✅ |
| **K6** | `W` recoge la fila inferior (10, 20, …, 90) | Espejo en el sentido equivocado | ✅ |
| **K7** | `G` recoge la fila superior (1, 11, …, 81) | Origen del patrón desplazado | ✅ |
| **K8** | Un protocolo real calificado a mano reproduce los 20 puntajes | Todo lo demás | ❌ |

K1–K7 son mecánicas y ya pasan. **K8 es la firma clínica y sigue pendiente.**

Verificación adicional en ejecución: sobre 5 000 protocolos simulados, y en los dos casos extremos de responder siempre A o siempre B, la suma de los diez roles da 45 y la de las diez necesidades otros 45, con todo factor dentro de 0–9.

### 3.3 Banco de ítems ✅

Los 90 pares se extraen de `Cuestionario.docx` de forma determinista. Verificado en este repo: tras descartar instrucciones y saltos de página quedan **exactamente 180 frases**, es decir 90 pares limpios.

| Par | Opción A | Opción B |
|-----|----------|----------|
| 1 | Soy trabajador | No soy de humor variable |
| 2 | Me gusta hacer el trabajo mejor que los demás | Me gusta seguir con lo que he empezado hasta terminarlo |
| 45 | Me gusta jugar y hacer deportes | Soy muy agradable |
| 90 | Me gusta que me digan que he de hacer | Tengo que terminar lo que he empezado |

**Impacto:** M2 (catálogo de pruebas) pasa de transcripción manual a *script de extracción + revisión ortotipográfica del psicólogo*.

**Detalle a validar con el psicólogo:** el par 1 aparece tres veces en el `.docx` (dos como ejemplo dentro de las instrucciones). El extractor descarta las dos primeras repeticiones; confirmar que el ítem 1 real es efectivamente *"Soy trabajador" / "No soy de humor variable"*.

---

## 4. Interpretación (M6)

No se genera texto libre. Se compone a partir de reglas versionadas extraídas de `Prueba PAPI.docx`:

```jsonc
// papi/interpretation-rules.v1.json
{
  "factor": "N",
  "bands": [
    { "min": 0, "max": 2, "label": "bajo",  "text": "…texto del manual…" },
    { "min": 3, "max": 6, "label": "medio", "text": "…" },
    { "min": 7, "max": 9, "label": "alto",  "text": "…" }
  ],
  "associations": [
    { "with": "G", "rule": "N alto + G bajo", "text": "…" }
  ]
}
```

Tres capas, en este orden:

1. **Por factor** — banda alta / media / baja según el puntaje 0–9.
2. **Por díada** — las 10 asociaciones rol–necesidad (N–G, A–L, P–I, X–T, B–V, O–S, Z–R, K–D, F–C, W–E). El manual las trata como el núcleo interpretativo: la tensión entre lo que la persona *necesita* y el *rol* que despliega.
3. **Perfil global** — efecto de estrés y comentarios transversales del manual.

**Regla de producto innegociable:** todo texto sale marcado como **borrador**; el informe solo se emite tras la aprobación explícita del psicólogo (§ plan, riesgo de sobreconfianza clínica).

---

## 5. Gráfica del perfil (M6)

`Grafica PAPI.doc` define el perfil visual. Implementación: SVG propio (no librería de charts genérica) con las 20 columnas en el mismo orden y agrupación que la plantilla en papel — roles arriba, necesidades abajo, alineadas por díada, de modo que el psicólogo lea la gráfica de pantalla igual que la de papel.

---

## 6. Pendientes

- [x] **Clave derivada** del procedimiento de corrección del manual y verificada contra la hoja. Pasa K1–K7 · `app/src/data/papi-key.json`
- [x] **Consignas de aplicación** transcritas del manual · `app/src/app/papi/consignas.ts`
- [ ] **❌ Un protocolo PAPI real calificado a mano** (respuestas A/B + los 20 puntajes) para **K8**. Sin esto la clave no se puede firmar.
- [ ] Vaciar textos de interpretación por factor y por díada desde `Prueba PAPI.docx`.
- [ ] Digitalizar bandas y escalas de `Grafica PAPI.doc`.
- [ ] Confirmar el ítem 1 real (§3.3).

---

## 7. Nota de licencia

El PAPI es un instrumento con licencia del editor. La plataforma es **interna**: el cuestionario completo, la clave y el manual no se exponen públicamente, el acceso es nominal y auditado, y no se habilita autoservicio del evaluado sin criterio profesional. Ver §11 del plan.

---

*Documento de referencia para desarrollo. No sustituye el criterio clínico del psicólogo.*
