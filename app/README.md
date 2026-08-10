# Plataforma de evaluación psicológica

Aplicación, calificación e interpretación de **PAPI**, **Hartman** y **MABE**.
Uso interno y profesional.

```bash
npm install
npm run dev          # http://localhost:3000
```

## Estado

| Instrumento | Reactivos | Motor de calificación |
|-------------|-----------|------------------------|
| **PAPI** | ✅ los 90 pares reales, extraídos del cuadernillo | ⚠️ clave **provisional** — estructura válida, enrutamiento por confirmar |
| **Hartman** | ✅ las dos partes de 18, con norma y clave I/E/S | ✅ completo y probado |
| **MABE** | ❌ pendientes de la plantilla de calificación | ✅ fórmulas extraídas, sin implementar |

## Estructura

```
src/
  app/          páginas: selector, papi, hartman, mabe
  lib/
    papi.ts     motor PAPI + verificación de invariantes de la clave
    hartman.ts  motor Hartman completo + tabla de niveles 1–7
    storage.ts  persistencia (hoy localStorage, mañana PostgreSQL)
  data/         reactivos y claves, versionados como datos
```

Los motores son **funciones puras**: no tocan base de datos, red ni DOM.
Se prueban aislados y se pueden ejecutar miles de veces por segundo.

```bash
node --experimental-strip-types src/lib/hartman.test.ts
```

## Conectar la base de datos

`src/lib/storage.ts` expone cuatro funciones (`nuevaSesion`, `guardar`, `cargar`,
`borrar`) cuya forma de datos coincide con las tablas `assessment_sessions` y
`responses` del modelo. Sustituir su implementación por consultas a PostgreSQL
no obliga a tocar ninguna pantalla.

## Advertencia

La clave de calificación de PAPI es provisional. **No debe emitirse ningún
informe clínico** a partir de los puntajes que produce hoy la plataforma.
