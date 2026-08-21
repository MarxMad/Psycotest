# Cronograma de desarrollo — 3 instrumentos · 3 meses

**Revisión 5** · Plataforma interna de pruebas psicológicas · **PAPI · Hartman · MABE**
Complementa [`ARQUITECTURA-TECNICA.md`](ARQUITECTURA-TECNICA.md) y los tres documentos de calificación.

---

## 1. La cifra

| | Valor |
|---|---:|
| Horas de desarrollo restantes | **86 h** |
| Precio | **15 000 MXN** |
| Forma de pago | **3 mensualidades de 5 000 MXN** |
| Duración | **3 meses** (~7 h/semana) |

Equivale a ~174 MXN/hora, es decir 10 USD/h al tipo de cambio de 17.40.

> **Nota interna.** El precio se fijó como **precio de introducción para cliente nuevo**, no como resultado de multiplicar horas. El documento del cliente no muestra horas a propósito: cotiza alcance. Ver §7.

---

## 2. Lo que ya está construido

No entra en las 86 horas porque ya está hecho:

| | Estado |
|---|---|
| Metodología de los tres instrumentos | ✅ documentada y verificada |
| Motor de calificación Hartman | ✅ implementado y probado |
| Clave de calificación PAPI | ✅ derivada del manual y verificada contra la hoja |
| Tabla de niveles de desarrollo de Hartman | ✅ 158 bandas en CSV |
| Fórmulas de MABE | ✅ extraídas del libro de calificación |
| Bancos de reactivos PAPI y Hartman | ✅ extraídos de los cuadernillos |
| Instrucciones de aplicación de ambos | ✅ transcritas de los manuales |
| Textos de interpretación de Hartman | ✅ los tres axiogramas |
| Aplicación web con las tres pruebas | ✅ captura, calificación y hoja de perfil |

---

## 3. Las 86 horas restantes

| Bloque | Tarea | h |
|--------|-------|--:|
| **Validación** | Contrastar la clave PAPI contra el protocolo calificado a mano | 4 |
| | Contrastar Hartman contra su protocolo | 2 |
| | Plantilla MABE y banco de reactivos | 6 |
| **Datos** | Esquema PostgreSQL y migraciones | 4 |
| | Sustituir el almacenamiento local por consultas | 3 |
| | Autenticación y control de accesos por rol | 5 |
| **Captura** | Participantes y sesiones | 5 |
| | Perfiles de puesto (MABE evalúa también el puesto) | 3 |
| | Captura de los cuatro bloques de MABE | 5 |
| **Calificación** | Motor MABE y sus pruebas | 7 |
| **Panel del psicólogo** | Listado de sesiones con filtros y estado | 4 |
| | Detalle de resultados por sesión | 4 |
| | Notas, aprobación y firma del informe | 4 |
| | Bitácora de auditoría | 3 |
| **Interpretación** | Cargar y componer los textos de los tres instrumentos | 7 |
| | Los tres axiogramas de Hartman | 5 |
| | Las dos gráficas comparativas de MABE | 4 |
| | Informe en PDF con trazabilidad | 3 |
| **Cierre** | Consentimiento, retención y cifrado | 2 |
| | Despliegue a producción | 2 |
| | Capacitación y aceptación | 4 |
| | **Total** | **86** |

---

## 4. Los tres meses

| Mes | Semanas | Trabajo | h | Al cerrar el mes |
|:---:|---------|---------|--:|------------------|
| **1** | 1–4 | Validación de la metodología · base de datos · autenticación · participantes y sesiones | 29 | Las tres pruebas se capturan y se guardan, con usuarios y roles |
| **2** | 5–8 | Captura de MABE · motor MABE · **panel del psicólogo** completo | 30 | Los tres instrumentos se califican solos y hay panel para revisarlos |
| **3** | 9–12 | Interpretación de los tres · axiogramas · gráficas MABE · informe PDF · producción | 27 | Informes completos, firmados, en producción interna |

---

## 5. El panel del psicólogo

Módulo nuevo respecto a revisiones anteriores, ahora explícito en el alcance del mes 2.

| Pantalla | Contenido |
|----------|-----------|
| **Listado de sesiones** | Todas las aplicaciones, filtrables por participante, instrumento, fecha y estado (en captura · calificada · aprobada) |
| **Detalle de resultados** | Puntajes, gráficas y el desglose ítem por ítem, con las disimilitudes marcadas en rojo |
| **Banderas de validez** | Protocolos bloqueados por DIS ≥ 6, sumas incorrectas o bloques incompletos, con el motivo visible |
| **Revisión y firma** | Edición del texto borrador, notas clínicas, aprobación nominal e inmutabilidad posterior |
| **Bitácora** | Quién capturó, quién calificó, quién aprobó, cuándo y con qué versión de clave |
| **Administración** | Usuarios y roles; carga de versiones de metodología |

**Roles:** el aplicador captura, el psicólogo interpreta y firma, el administrador gestiona usuarios sin ver contenido clínico.

---

## 6. Hitos y pagos

| Pago | Cuándo | Criterio de aceptación | Monto |
|:----:|--------|------------------------|------:|
| **1** | Al firmar | Metodología validada contra los protocolos; las tres pruebas se capturan y guardan | 5 000 MXN |
| **2** | A 30 días | Las tres pruebas se califican solas y el panel permite revisarlas | 5 000 MXN |
| **3** | A 60 días | Informes completos con gráficas, firma y PDF; sistema en producción | 5 000 MXN |
| | | **Total** | **15 000 MXN** |

---

## 7. Nota sobre el precio

El documento del cliente **no muestra horas**. Es deliberado:

1. **Facturar por hora regala la ventaja de velocidad.** Entre más rápido se entrega, menos se cobra. Cotizar alcance rompe esa relación.
2. **Un desglose por horas invita a regatear partidas** en vez de decidir sobre el resultado.
3. **Ancla la tarifa** para la segunda fase y el mantenimiento, donde conviene cobrar a valor de mercado.

Los 15 000 MXN se presentan como **precio de introducción de primer proyecto**, con el alcance completo de los tres instrumentos. Conviene decirlo así explícitamente: deja claro que es una condición de arranque y no la tarifa habitual.

**Qué cotizar aparte, desde ahora:** mantenimiento posterior a la entrega, aplicación en pantalla para que el evaluado conteste directamente, y cualquier instrumento adicional.

---

## 8. Ruta crítica

| Entregable del psicólogo | Cuándo | Si no llega |
|--------------------------|--------|-------------|
| 🔴 Protocolo PAPI calificado a mano | Semana 1 | La clave no se firma |
| 🔴 Protocolo Hartman calificado a mano | Semana 1 | Queda una suposición abierta en el motor |
| 🔴 Protocolo MABE (persona y puesto) | Semana 2 | No se valida el motor MABE |
| 🔴 Plantilla de calificación de MABE en formato legible | Semana 2 | Falta el mapa reactivo → letra |
| 🟠 Cuadernillo de MABE | Semana 3 | No hay banco de reactivos |
| 🟠 Textos de interpretación de PAPI y MABE en la plantilla | Semana 8 | El mes 3 se detiene |
| 🟡 Licencias vigentes de los tres instrumentos | Semana 2 | Riesgo legal abierto |
| 🟡 Aviso de privacidad y política de retención | Semana 11 | No se puede desplegar |

Las tablas de medias por factor del PAPI (población de 1 605 personas, según el manual) siguen pendientes de extraer: sin ellas la hoja de perfil se dibuja sin las bandas de referencia.

---

*Revisión 5 · tres instrumentos, panel del psicólogo incluido. Detalle técnico en `PAPI-CALIFICACION.md`, `HARTMAN-CALIFICACION.md`, `MABE-CALIFICACION.md` y `ARQUITECTURA-TECNICA.md`.*
