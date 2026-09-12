# Especificación de calificación — Técnica Cleaver (Autodescripción)

Fuentes en `app/src/data/referencias/cleaver/`:

| Archivo | Uso |
|---------|-----|
| `Manual_Cleaver.pdf` | Marco teórico DISC, aplicación, calificación, gráficas T/M/L |
| `Hoja_de_calificacion.pdf` | Cuestionario Autodescripción (24 series × 4 adjetivos, columnas M/L) |
| `Plantilla_de_calificacion.pdf` | Clave color → factor D/I/S/C |
| `Analisis_del_Trabajo.pdf` | Formato Job Analysis / Factor Humano del puesto (**fase 2**) |

## 1. Instrumento digitalizado (fase 1)

**Autodescripción (Self Description)** — 24 series de 4 adjetivos.

En cada serie el evaluado marca:

- **M** (Más): la palabra que mejor lo describe
- **L** (Menos): la que menos lo describe

Exactamente una M y una L por serie; no pueden ser la misma palabra.

## 2. Factores

| Código | Nombre (manual) |
|--------|-----------------|
| **D** | Dominio |
| **I** | Influencia |
| **S** | Constancia (Steadiness) |
| **C** | Apego / Cumplimiento |

Cada adjetivo pertenece a un único factor (plantilla).

## 3. Calificación

1. Contar Xs de **M** por factor → `M.D … M.C` (suma = 24 si completo).
2. Contar Xs de **L** por factor → `L.D … L.C` (suma = 24).
3. `T.f = M.f − L.f` para cada factor.
4. **Validez:** `Σ T` debe ser ≈ 0 (rango útil −6…+6; el manual marca válida / sospechosa / inválida).

Ejemplo del manual:

| | D | I | S | C |
|---|---|---|---|---|
| M | 7 | 1 | 6 | 6 |
| L | 5 | 8 | 4 | 3 |
| T | 2 | −7 | 2 | 3 |

`Σ T = 0` → protocolo válido.

## 4. Gráficas

| Gráfica | Origen | Lectura clínica |
|---------|--------|-----------------|
| **M** | Conteos M | Estilo motivado / deseos |
| **L** | Conteos L | Bajo presión / limitaciones |
| **T** | Totales T = M−L | Estilo cotidiano / observable |

La conversión a intensidad gráfica normativa (baremo de la hoja) queda **pendiente de digitalizar celda a celda** desde la plantilla impresa; el motor entrega conteos crudos M/L/T listos para graficar.

## 5. Fase 2 (no incluida aún)

- **Análisis del Trabajo / Job Analysis (Factor Humano del puesto)** — perfil ideal D/I/S/C del puesto para comparar persona–puesto.
- Bancos de interpretación de estilos altos/bajos y los 8 patrones clásicos (manual §4.3).
- Baremo de conversión a puntos de gráfica.

## 6. Implementación

- Datos: `app/src/data/cleaver-items.json`
- Motor: `app/src/lib/cleaver.ts` → `calificarCleaver`
- Prueba: `app/src/lib/cleaver.test.ts`
