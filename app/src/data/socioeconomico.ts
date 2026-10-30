/**
 * Estudio Socioeconómico — el formulario, como datos.
 *
 * Transcribe las hojas del Excel que entregó el cliente («Estudio
 * Socioeconómico.xlsx»): generales, estructura familiar, situación económica,
 * actividades, salud, media filiación, escolaridad, referencias, patrón de
 * referencias, visita domiciliaria, vivienda y aviso de privacidad.
 *
 * No se califica: es un expediente. Cada sección dice quién la llena —el
 * candidato con su código, o el investigador desde el panel— y la misma
 * definición pinta el formulario, la vista de lectura y el PDF.
 */

export type TipoCampo =
  | "texto"
  | "textoLargo"
  | "fecha"
  | "hora"
  | "numero"
  | "moneda"
  | "telefono"
  | "correo"
  /** Una sola opción de la lista. */
  | "opcion"
  /** Varias opciones de la lista. */
  | "multiple"
  | "sino"
  /** Una calificación en la escala de `opciones` (1–10, Muy mal…Excelente, Alto/Medio/Bajo). */
  | "escala";

export type Campo = {
  id: string;
  etiqueta: string;
  tipo: TipoCampo;
  opciones?: readonly string[];
  requerido?: boolean;
  ayuda?: string;
  /** Ancho en la rejilla del formulario: por defecto, media fila. */
  ancho?: "completo" | "medio" | "tercio";
};

/** Un bloque que se repite: familiares, referencias, incapacidades… */
export type Lista = {
  id: string;
  /** Sustantivo de cada fila: «Familiar», «Referencia». */
  elemento: string;
  min: number;
  max: number;
  campos: Campo[];
};

export type Quien = "candidato" | "investigador";

export type Seccion = {
  id: string;
  titulo: string;
  descripcion?: string;
  quien: Quien;
  campos?: Campo[];
  lista?: Lista;
  /** Campos que van después de la lista (p. ej. «otros cursos» tras escolaridad). */
  camposFinales?: Campo[];
};

export type Valor = string | string[];
export type Fila = Record<string, Valor>;
export type ValoresSeccion = Record<string, Valor | Fila[]>;

export const SI_NO = ["Sí", "No"] as const;
export const ESCALA_1_10 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export const ESCALA_ENCUESTADOR = ["Muy mal", "Mal", "Regular", "Bien", "Excelente"] as const;
export const ESCALA_RIESGO = ["Alto", "Medio", "Bajo"] as const;

const t = (id: string, etiqueta: string, extra: Partial<Campo> = {}): Campo => ({
  id,
  etiqueta,
  tipo: "texto",
  ...extra,
});

/* ------------------------------------------------------------------ */
/* Lo que llena el candidato                                           */
/* ------------------------------------------------------------------ */

const GENERALES: Seccion = {
  id: "generales",
  titulo: "Datos generales",
  quien: "candidato",
  campos: [
    t("nombre", "Nombre completo", { requerido: true, ancho: "completo" }),
    t("domicilio", "Domicilio (calle y número)", { requerido: true, ancho: "completo" }),
    t("colonia", "Colonia", { requerido: true }),
    t("cp", "C.P.", { requerido: true, ancho: "tercio" }),
    t("delegacion", "Delegación o municipio", { requerido: true }),
    t("ciudad", "Ciudad", { requerido: true }),
    t("arraigo", "Arraigo", { ayuda: "Tiempo viviendo en este domicilio." }),
    t("telefono", "Teléfono", { tipo: "telefono", requerido: true }),
    t("nacionalidad", "Nacionalidad", { requerido: true }),
    t("lugarNacimiento", "Lugar de nacimiento", { requerido: true }),
    t("fechaNacimiento", "Fecha de nacimiento", { tipo: "fecha", requerido: true }),
    t("nivelAcademico", "Nivel académico", {
      tipo: "opcion",
      opciones: ["Primaria", "Secundaria", "Bachillerato", "Técnico", "Licenciatura", "Posgrado"],
      requerido: true,
    }),
    t("estadoCivil", "Estado civil", {
      tipo: "opcion",
      opciones: ["Soltero(a)", "Casado(a)", "Unión libre", "Divorciado(a)", "Viudo(a)"],
      requerido: true,
    }),
    t("fechaCasamiento", "Fecha de casamiento", { tipo: "fecha", ayuda: "Sólo si es casado(a)." }),
    t("matrimonioCivil", "Matrimonio civil", { tipo: "sino", opciones: SI_NO, ancho: "tercio" }),
    t("matrimonioReligioso", "Matrimonio religioso", { tipo: "sino", opciones: SI_NO, ancho: "tercio" }),
  ],
};

const DOCUMENTOS: Seccion = {
  id: "documentos",
  titulo: "Documentos e identificaciones",
  quien: "candidato",
  campos: [
    t("rfc", "Registro Federal de Contribuyentes (RFC)"),
    t("curp", "CURP", { requerido: true }),
    t("imss", "Afiliación al IMSS (NSS)"),
    t("cartilla", "No. de cartilla militar"),
    t("cartillaLiberacion", "Fecha de liberación", { tipo: "fecha" }),
    t("licencia", "No. de licencia de conducir"),
    t("licenciaVencimiento", "Fecha de vencimiento", { tipo: "fecha" }),
    t("pasaporte", "Pasaporte"),
    t("cedula", "Cédula profesional"),
    t("otro", "Otro documento"),
  ],
};

const PARENTESCOS = ["Cónyuge", "Hijo(a)", "Padre", "Madre", "Hermano(a)", "Otro"] as const;

const FAMILIA: Seccion = {
  id: "familia",
  titulo: "Estructura familiar",
  descripcion: "Cónyuge, hijos, padres y hermanos.",
  quien: "candidato",
  campos: [
    t("viveCon", "¿Con quién vive?", { requerido: true, ancho: "completo" }),
    t("personasTrabajan", "¿Cuántas personas trabajan en su hogar?", { tipo: "numero", requerido: true }),
    t("dependientes", "Dependientes económicos", { tipo: "numero", requerido: true }),
  ],
  lista: {
    id: "familiares",
    elemento: "Familiar",
    min: 1,
    max: 16,
    campos: [
      t("parentesco", "Parentesco", { tipo: "opcion", opciones: PARENTESCOS, requerido: true }),
      t("nombre", "Nombre", { requerido: true }),
      t("edad", "Edad", { tipo: "numero", ancho: "tercio" }),
      t("ocupacion", "Ocupación"),
      t("empresa", "Empresa"),
      t("domicilio", "Domicilio", { ancho: "completo" }),
      t("telefono", "Teléfono", { tipo: "telefono" }),
    ],
  },
};

/** Las fuentes de ingreso del lado izquierdo de la hoja 3. */
export const FUENTES_INGRESO = [
  { id: "prospecto", etiqueta: "Ingresos del prospecto", conEgresos: true },
  { id: "conyuge", etiqueta: "Ingresos del cónyuge", conEgresos: true },
  { id: "otrosMiembros", etiqueta: "Ingresos de otros miembros", conEgresos: true },
  { id: "otros", etiqueta: "Otros ingresos", conEgresos: false },
] as const;

/** El desglose de egresos mensuales, lado derecho de la hoja 3. */
export const CONCEPTOS_EGRESO = [
  ["renta", "Renta"],
  ["hipoteca", "Hipoteca"],
  ["luz", "Luz"],
  ["agua", "Agua"],
  ["gas", "Gas"],
  ["alimentacion", "Alimentación"],
  ["transporte", "Transporte"],
  ["educacion", "Educación"],
  ["gastosMedicos", "Gastos médicos"],
  ["diversiones", "Diversiones"],
  ["seguros", "Seguros"],
  ["tarjetas", "Tarjetas de crédito"],
  ["deudas", "Deudas"],
  ["otros", "Otros"],
] as const;

const ECONOMIA: Seccion = {
  id: "economia",
  titulo: "Situación económica",
  descripcion: "Montos mensuales en pesos.",
  quien: "candidato",
  campos: [
    ...FUENTES_INGRESO.flatMap((f) => [
      t(`ingreso_${f.id}`, f.etiqueta, { tipo: "moneda", requerido: f.id === "prospecto" }),
      t(`ingreso_${f.id}_especifique`, "Especifique"),
      ...(f.conEgresos
        ? [
            t(`ingreso_${f.id}_egresos`, "Egresos", { tipo: "moneda" }),
            t(`ingreso_${f.id}_egresos_especifique`, "Especifique"),
          ]
        : []),
    ]),
    ...CONCEPTOS_EGRESO.map(([id, etiqueta]) =>
      t(`egreso_${id}`, `Egreso: ${etiqueta}`, { tipo: "moneda", ancho: "tercio" }),
    ),
    t("comoCubreGastos", "¿Cómo cubre sus gastos actualmente?", { tipo: "textoLargo", ancho: "completo" }),
    t("automoviles", "Automóviles", { ayuda: "Marca, modelo y año; o «ninguno»." }),
    t("casas", "Casas"),
    t("terrenos", "Terrenos"),
  ],
};

const SOCIAL: Seccion = {
  id: "social",
  titulo: "Actividades sociales y deportivas",
  quien: "candidato",
  campos: [
    t("religion", "Religión", { ayuda: "Opcional." }),
    t("sindicato", "¿Pertenece a algún sindicato?", { ayuda: "¿Cuál?" }),
    t("club", "¿Pertenece a algún club social?", { ayuda: "¿Cuál?" }),
    t("pasatiempos", "Pasatiempos"),
    t("tiempoPasatiempos", "¿Qué tiempo le dedica?"),
    t("meta", "¿Cuál es su meta en la vida?", { tipo: "textoLargo", ancho: "completo" }),
    t("relacionesVecinales", "Relaciones vecinales"),
    t("actividadesPoliticas", "Actividades políticas", { ayuda: "Opcional." }),
  ],
};

const SALUD: Seccion = {
  id: "salud",
  titulo: "Estado de salud",
  quien: "candidato",
  campos: [
    t("antecedentesFamilia", "Antecedentes de enfermedades en la familia", { tipo: "textoLargo", ancho: "completo" }),
    t("enfermedades", "Enfermedades importantes"),
    t("enfermedadesFecha", "Fecha de padecimiento"),
    t("operaciones", "Operaciones importantes"),
    t("operacionesFecha", "Fecha de operación"),
    t("enfermedadesFamiliares", "Enfermedades de familiares directos", { tipo: "textoLargo", ancho: "completo" }),
  ],
  lista: {
    id: "incapacidades",
    elemento: "Incapacidad laboral",
    min: 0,
    max: 10,
    campos: [
      t("anio", "Año", { tipo: "numero", ancho: "tercio" }),
      t("patron", "Patrón"),
      t("duracion", "Duración", { ancho: "tercio" }),
      t("motivo", "Motivo", { ancho: "completo" }),
    ],
  },
};

const ESCOLARIDAD: Seccion = {
  id: "escolaridad",
  titulo: "Escolaridad",
  descripcion: "Un renglón por nivel cursado.",
  quien: "candidato",
  lista: {
    id: "niveles",
    elemento: "Nivel",
    min: 1,
    max: 6,
    campos: [
      t("nivel", "Nivel", {
        tipo: "opcion",
        opciones: ["Primaria", "Secundaria", "Bachillerato", "Profesional", "Posgrado"],
        requerido: true,
      }),
      t("institucion", "Escuela", { requerido: true }),
      t("periodo", "Años de inicio y terminación", { ayuda: "Ej. 2008–2011" }),
      t("aniosCursados", "Años cursados", { tipo: "numero", ancho: "tercio" }),
      t("domicilio", "Domicilio de la escuela", { ancho: "completo" }),
      t("documento", "¿Cuenta con documento?", { tipo: "sino", opciones: SI_NO }),
      t("tipoComprobante", "Tipo de comprobante", { ayuda: "Certificado, título, constancia…" }),
    ],
  },
  camposFinales: [
    t("estudiosTruncos", "¿Estudios truncos?", { tipo: "sino", opciones: SI_NO }),
    t("estudiosTruncosMotivo", "Motivo"),
    t("otrosCursos", "Otros cursos", { tipo: "textoLargo", ancho: "completo" }),
  ],
};

const REF_PERSONALES: Seccion = {
  id: "refPersonales",
  titulo: "Referencias personales",
  descripcion: "Tres personas que lo conozcan y no sean familiares.",
  quien: "candidato",
  lista: {
    id: "referencias",
    elemento: "Referencia",
    min: 3,
    max: 3,
    campos: [
      t("nombre", "Nombre", { requerido: true }),
      t("telefono", "Teléfono", { tipo: "telefono", requerido: true }),
      t("anios", "Años de conocerlo", { tipo: "numero", ancho: "tercio" }),
      t("relacion", "Relación"),
      t("ocupacion", "Ocupación"),
      t("dondeConocio", "Dónde lo conoció"),
      t("domicilio", "Domicilio", { ancho: "completo" }),
    ],
  },
};

const REF_LABORALES: Seccion = {
  id: "refLaborales",
  titulo: "Referencias laborales",
  descripcion: "Sus últimos empleos, empezando por el más reciente.",
  quien: "candidato",
  lista: {
    id: "empleos",
    elemento: "Empleo",
    min: 0,
    max: 3,
    campos: [
      t("empresa", "Empresa", { requerido: true }),
      t("telefono", "Teléfono", { tipo: "telefono" }),
      t("direccion", "Dirección", { ancho: "completo" }),
      t("ingreso", "Fecha de ingreso", { tipo: "fecha" }),
      t("egreso", "Fecha de egreso", { tipo: "fecha" }),
      t("antiguedad", "Antigüedad"),
      t("ultimoPuesto", "Último puesto"),
      t("motivoSalida", "Motivo de salida"),
      t("sueldoInicial", "Sueldo integrado inicial", { tipo: "moneda" }),
      t("sueldoFinal", "Sueldo integrado final", { tipo: "moneda" }),
      t("jefe", "Nombre del jefe inmediato"),
      t("jefePuesto", "Puesto del jefe"),
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Lo que llena el investigador                                        */
/* ------------------------------------------------------------------ */

const SOLICITUD: Seccion = {
  id: "solicitud",
  titulo: "Datos de la solicitud",
  quien: "investigador",
  campos: [
    t("responsable", "Responsable del estudio", { requerido: true }),
    t("fecha", "Fecha del estudio", { tipo: "fecha", requerido: true }),
    t("codigo", "Código o folio"),
    t("empresa", "Empresa que solicita", { requerido: true }),
    t("fechaSolicitud", "Fecha de solicitud", { tipo: "fecha" }),
    t("representante", "Representante de la empresa"),
    t("cargo", "Cargo"),
    t("puesto", "Puesto para el cual se solicita", { requerido: true }),
    t("domicilioPuesto", "Domicilio del puesto solicitado", { ancho: "completo" }),
    t("telefonos", "Teléfonos", { tipo: "telefono" }),
    t("web", "Web"),
  ],
};

const VISITA: Seccion = {
  id: "visita",
  titulo: "Visita domiciliaria",
  descripcion:
    "La constancia de la visita y la evaluación que el entrevistado hace del encuestador (se le pregunta al terminar).",
  quien: "investigador",
  campos: [
    t("responsable", "Responsable (encuestador)", { requerido: true }),
    t("fecha", "Fecha de la visita", { tipo: "fecha", requerido: true }),
    t("lugar", "Lugar", { requerido: true }),
    t("domicilio", "Domicilio donde se realizó", { ancho: "completo" }),
    t("horaInicio", "Hora de inicio", { tipo: "hora", ancho: "tercio" }),
    t("horaFin", "Hora de terminación", { tipo: "hora", ancho: "tercio" }),
    t("autorizo", "El entrevistado autorizó la visita", { tipo: "sino", opciones: SI_NO, ancho: "tercio" }),
    ...(
      [
        ["presentacion", "Presentación"],
        ["puntualidad", "Puntualidad"],
        ["amabilidad", "Amabilidad"],
        ["comunicacion", "Comunicación"],
        ["tolerancia", "Tolerancia"],
        ["respeto", "Respeto"],
      ] as const
    ).map(([id, etiqueta]) =>
      t(`encuestador_${id}`, `Encuestador · ${etiqueta}`, {
        tipo: "escala",
        opciones: ESCALA_ENCUESTADOR,
        ancho: "completo",
      }),
    ),
    t("comentarios", "Comentarios adicionales del entrevistado", { tipo: "textoLargo", ancho: "completo" }),
  ],
};

const MEDIA_FILIACION: Seccion = {
  id: "mediaFiliacion",
  titulo: "Media filiación",
  quien: "investigador",
  campos: [
    t("estatura", "Estatura", { ancho: "tercio" }),
    t("peso", "Peso", { ancho: "tercio" }),
    t("tez", "Tez", { ancho: "tercio" }),
    t("ojos", "Ojos", { ancho: "tercio" }),
    t("nariz", "Nariz", { ancho: "tercio" }),
    t("boca", "Boca", { ancho: "tercio" }),
    t("cejas", "Cejas", { ancho: "tercio" }),
    t("complexion", "Complexión", { ancho: "tercio" }),
    t("senas", "Señas particulares", { tipo: "textoLargo", ancho: "completo" }),
  ],
};

const VIVIENDA: Seccion = {
  id: "vivienda",
  titulo: "Vivienda y zona",
  quien: "investigador",
  campos: [
    t("zona", "Zona", { tipo: "opcion", opciones: ["Urbana", "Rural", "Suburbana", "Periferia"], requerido: true }),
    t("clase", "Nivel de la zona", {
      tipo: "opcion",
      opciones: ["Clase alta", "Media alta", "Media", "Baja"],
      requerido: true,
    }),
    t("servicios", "Servicios", {
      tipo: "multiple",
      opciones: ["Agua", "Alumbrado", "Drenaje", "Pavimentación", "Transporte", "Áreas verdes", "Vigilancia"],
      ancho: "completo",
    }),
    t("vias", "Vías rápidas de acceso", { ancho: "completo" }),
    t("tipoVivienda", "Tipo de vivienda", {
      tipo: "opcion",
      opciones: ["Casa", "Departamento", "Vecindad", "Otra"],
      requerido: true,
    }),
    t("tenencia", "La vivienda es", {
      tipo: "opcion",
      opciones: ["Propia", "Rentada", "Familiar", "Otro"],
      requerido: true,
    }),
    t("condiciones", "Condiciones", {
      tipo: "multiple",
      opciones: ["Ordenado", "Desordenado", "Descuidado", "Limpio", "Normal", "Sucio"],
      ancho: "completo",
    }),
    t("distribucion", "Distribución", {
      tipo: "multiple",
      opciones: [
        "Sala",
        "Comedor",
        "Cocina",
        "Baño",
        "Recámaras",
        "Alberca",
        "Estudio",
        "Biblioteca",
        "Garaje",
        "Cuarto de servicio",
        "Jardín",
        "Canchas",
      ],
      ancho: "completo",
    }),
    t("recamaras", "Número de recámaras", { tipo: "numero", ancho: "tercio" }),
    t("drogadiccion", "Drogadicción en la zona", { tipo: "escala", opciones: ESCALA_RIESGO, ancho: "tercio" }),
    t("alcoholismo", "Alcoholismo en la zona", { tipo: "escala", opciones: ESCALA_RIESGO, ancho: "tercio" }),
    t("delincuencia", "Delincuencia en la zona", { tipo: "escala", opciones: ESCALA_RIESGO, ancho: "tercio" }),
  ],
};

const OPINION_REFERENCIAS: Seccion = {
  id: "opinionReferencias",
  titulo: "Opinión de las referencias personales",
  descripcion: "Lo que dijo cada referencia personal al contactarla.",
  quien: "investigador",
  lista: {
    id: "opiniones",
    elemento: "Referencia",
    min: 0,
    max: 3,
    campos: [
      t("referencia", "Referencia", { requerido: true }),
      t("opinion", "Opinión", { tipo: "textoLargo", ancho: "completo" }),
    ],
  },
};

/** Los conceptos que califica el patrón, de 1 a 10 (hoja 6). */
export const CONCEPTOS_PATRON = [
  ["responsabilidad", "Responsabilidad"],
  ["actitudServicio", "Actitud de servicio"],
  ["trabajoEquipo", "Trabajo en equipo"],
  ["liderazgo", "Liderazgo"],
  ["puntualidad", "Puntualidad"],
  ["disponibilidad", "Disponibilidad"],
  ["disciplina", "Disciplina"],
  ["logroObjetivos", "Logro de objetivos"],
  ["saludFisica", "Salud física"],
  ["confiable", "Confiable"],
  ["desempeno", "Desempeño"],
] as const;

const PATRON_REFERENCIAS: Seccion = {
  id: "patronReferencias",
  titulo: "Patrón de referencias",
  descripcion: "La verificación con cada empleo anterior: lo que contesta el jefe inmediato.",
  quien: "investigador",
  lista: {
    id: "verificaciones",
    elemento: "Verificación",
    min: 0,
    max: 3,
    campos: [
      t("empresa", "Empresa", { requerido: true }),
      t("jefe", "Jefe inmediato"),
      t("jefePuesto", "Puesto del jefe"),
      t("tiempoTrabajo", "Tiempo de trabajo"),
      t("puesto", "Puesto del candidato"),
      t("duracion", "Duración"),
      ...CONCEPTOS_PATRON.map(([id, etiqueta]) =>
        t(`cal_${id}`, etiqueta, { tipo: "escala", opciones: ESCALA_1_10, ancho: "completo" }),
      ),
      t("recomienda", "¿Lo recomendaría nuevamente?", { tipo: "sino", opciones: SI_NO, requerido: true }),
      t("informante", "Nombre de quien informa"),
      t("informantePuesto", "Puesto de quien informa"),
    ],
  },
};

export const DICTAMENES = ["Favorable", "Favorable con reservas", "No favorable"] as const;

const CONCLUSION: Seccion = {
  id: "conclusion",
  titulo: "Conclusión",
  quien: "investigador",
  campos: [
    t("elaboro", "Elaboró", { requerido: true }),
    t("dictamen", "Dictamen", { tipo: "opcion", opciones: DICTAMENES, requerido: true }),
    t("observaciones", "Observaciones", { tipo: "textoLargo", ancho: "completo" }),
  ],
};

export const SECCIONES_CANDIDATO: Seccion[] = [
  GENERALES,
  DOCUMENTOS,
  FAMILIA,
  ECONOMIA,
  SOCIAL,
  SALUD,
  ESCOLARIDAD,
  REF_PERSONALES,
  REF_LABORALES,
];

export const SECCIONES_INVESTIGADOR: Seccion[] = [
  SOLICITUD,
  VISITA,
  MEDIA_FILIACION,
  VIVIENDA,
  OPINION_REFERENCIAS,
  PATRON_REFERENCIAS,
  CONCLUSION,
];

/* ------------------------------------------------------------------ */
/* Aviso de privacidad                                                 */
/* ------------------------------------------------------------------ */

/**
 * Responsable del tratamiento de los datos. EL EXCEL LO TRAE EN BLANCO: hay
 * que llenar razón social y contacto antes de usar el estudio con candidatos
 * reales. Mientras falte, el aviso lo dice en pantalla.
 */
export const RESPONSABLE_DATOS = {
  empresa: "",
  encargado: "",
  telefono: "",
  correo: "",
};

export const DATOS_RECABADOS = [
  "Nombre",
  "Domicilio",
  "Edad",
  "Sexo",
  "Número telefónico",
  "Nacionalidad",
  "CURP",
  "RFC",
  "Número de seguro social",
  "Competencias personales",
  "Dominio de idiomas",
  "Datos familiares: hermanos, padres, cónyuge e hijos",
  "Datos académicos",
  "Cursos de capacitación",
  "Referencias personales",
  "Referencias laborales",
] as const;

export const TRANSFERENCIA = {
  acepta: "Acepto que mis datos sean transferidos",
  noAcepta: "No acepto que mis datos sean transferidos",
} as const;

/** El texto del aviso, en párrafos, con el responsable sustituido. */
export function textoAviso(r = RESPONSABLE_DATOS) {
  const empresa = r.empresa || "[razón social pendiente]";
  return {
    apertura: `La empresa ${empresa} es responsable de recabar sus datos personales, del uso que se le dé a los mismos y de su protección. Con el fin de dar cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, y toda vez que contamos con información de sus datos personales, tales como:`,
    sensibles:
      "Considerando que son sensibles, según la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, el origen étnico o racial, las características morales o emocionales, la ideología y opiniones políticas, las creencias y convicciones religiosas o filosóficas y la preferencia sexual, le informamos que sus datos personales pueden ser transferidos a terceros dentro y/o fuera del país exclusivamente con el propósito de aplicar a una candidatura y/o contratación laboral.",
    consentimiento:
      "Si usted no manifiesta su oposición para que sus datos personales sean transferidos, se entenderá que ha otorgado su consentimiento para ello.",
    derechos:
      "Usted tiene derecho de acceder, rectificar y cancelar sus datos personales, así como de oponerse al tratamiento de los mismos o revocar el consentimiento que para tal fin nos haya otorgado, a través de los procedimientos que hemos implementado.",
    contacto: `Para conocer dichos procedimientos, los requisitos y plazos, se puede poner en contacto con ${
      r.encargado || "[encargado pendiente]"
    }, encargado de protección de datos personales, al teléfono ${r.telefono || "[pendiente]"} o al correo ${
      r.correo || "[pendiente]"
    }.`,
  };
}

export const AVISO_COMPLETO = Boolean(
  RESPONSABLE_DATOS.empresa && RESPONSABLE_DATOS.encargado && (RESPONSABLE_DATOS.telefono || RESPONSABLE_DATOS.correo),
);
