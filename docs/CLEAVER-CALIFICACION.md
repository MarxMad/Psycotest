# Especificación de calificación — Técnica Cleaver

Fuentes en `app/src/data/referencias/cleaver/`:

| Archivo | Uso |
|---------|-----|
| `Manual_Cleaver.pdf` | Marco teórico DISC, Autodescripción, Factor Humano, estilos |
| `Hoja_de_calificacion.pdf` | Cuestionario Autodescripción (24×4, columnas M/L) |
| `Plantilla_de_calificacion.pdf` | Clave color → factor D/I/S/C |
| `Analisis_del_Trabajo.pdf` | Plantilla de calificación Factor Humano del puesto |

## 1. Autodescripción (fase 1) — digitalizada

24 series × 4 adjetivos. En cada serie:

- **M** (Más): la palabra que mejor lo describe
- **L** (Menos): la que menos lo describe

Exactamente una M y una L; no la misma palabra.

### Factores

| Código | Nombre |
|--------|--------|
| **D** | Dominio |
| **I** | Influencia |
| **S** | Constancia (Steadiness) |
| **C** | Apego / Cumplimiento |

### Calificación

1. Contar M por factor → `M.D…M.C` (suma = 24)
2. Contar L por factor → `L.D…L.C` (suma = 24)
3. `T.f = M.f − L.f`
4. **Validez** `ΣT`: válida |ΣT|≤3 · sospechosa 4–5 · inválida ≥6

Ejemplo del manual: M 7,1,6,6 / L 5,8,4,3 → T 2,−7,2,3 · ΣT=0

### Gráficas y baremo

| Gráfica | Origen | Lectura |
|---------|--------|---------|
| **M** | Conteos M | Motivado / deseos |
| **L** | Conteos L | Bajo presión |
| **T** | M−L | Cotidiano / observable |

Conversión a intensidad 0–100: `app/src/data/cleaver-baremo.json`.  
**Aplanado** = los 4 factores entre 40 y 60 (manual).

### Interpretación

Banco en `cleaver-interpretacion.json`: genéricos alto/bajo, 12 combinaciones básicas, 8 estilos clásicos.

## 2. Factor Humano / Análisis del Trabajo (fase 2) — digitalizado end-to-end

24 ítems (6 por factor), rating 1–5 de importancia en el puesto.

1. `R` = suma por factor  
2. `A` = promedio de R (redondeo Cleaver: .25↓ · .50= · .75↑)  
3. `D = R − A`  
4. `D% = D × X(A)` según tabla del manual (12–28 → 8…3.5)  
5. Graficar `50 + D%`  
6. Aplanado puesto si 40–60 en los cuatro

Datos: `cleaver-job-items.json` · Motor: `lib/cleaver-job.ts`  
Persistencia: `job_profiles.cleaver_puesto` (JSON con respuestas + resultado).

### UI y API

| Pieza | Path |
|-------|------|
| CRUD perfiles | `/api/job-profiles`, `/api/job-profiles/[id]` |
| Formulario Análisis del Trabajo | `/admin/pruebas/perfiles` |
| Vincular a sesión Cleaver | select en `/admin/pruebas/sesiones/[id]` |
| Brecha persona−puesto | `CleaverGraficas` + `brechaPersonaPuesto` |

Flujo: crear Factor Humano → abrir sesión Cleaver → vincular perfil → ver gráfica de puesto y brecha vs gráfica T.

## 3. Persistencia (DB)

Tabla genérica `assessment_sessions`:

- `instrumento = "cleaver"`
- `respuestas` JSON `{ [serie]: { mas, menos } }`
- `calificacion` JSON (`ResultadoCleaver`: M/L/T, gráfica, aplanado, estilo, combinaciones, validez)
- `interpretacion` texto
- `validity_flags` derivados (incompleto, ΣT sospechosa/inválida, T aplanada, alertas)

Perfil de puesto: `job_profiles.cleaver_puesto` con resultado Factor Humano.

## 4. Implementación

| Pieza | Path |
|-------|------|
| Ítems Autodescripción | `app/src/data/cleaver-items.json` |
| Baremo | `app/src/data/cleaver-baremo.json` |
| Interpretación | `app/src/data/cleaver-interpretacion.json` |
| Ítems Factor Humano | `app/src/data/cleaver-job-items.json` |
| Motor persona | `app/src/lib/cleaver.ts` |
| Motor puesto | `app/src/lib/cleaver-job.ts` |
| Store perfiles | `app/src/lib/job-profiles-store.ts` |
| API perfiles | `app/src/app/api/job-profiles/` |
| UI Autodescripción | `app/src/app/psycotest/cleaver/` |
| UI Análisis del Trabajo | `app/src/app/admin/pruebas/perfiles/` |
| Tests | `app/src/lib/cleaver.test.ts` |
