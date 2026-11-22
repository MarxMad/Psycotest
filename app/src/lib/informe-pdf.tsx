import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { APP_NAME } from "./brand";
import { duracion, fechaHora } from "./tiempos-prueba";
import { SUBTITULO_INSTRUMENTO } from "@/lib/instrumentos";

/**
 * Informe de evaluación en formato de reporte profesional.
 *
 * Es lo que distingue a Psicología Aplicada: el informe no es una salida
 * automática, lo revisa y lo firma un psicólogo con cédula. El preliminar
 * (el que sale al terminar la prueba) lo dice claramente y deja el espacio de
 * firma pendiente; el validado lleva nombre, cédula y fecha de firma.
 */

const ROJO = "#b52a22";
const TINTA = "#1a1a1a";
const GRIS = "#5c5c5c";
const LINEA = "#e3dfd6";

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 64,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: TINTA,
  },
  banda: {
    backgroundColor: ROJO,
    paddingVertical: 18,
    paddingHorizontal: 48,
    marginBottom: 22,
  },
  marca: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.5 },
  marcaSub: { fontSize: 8, color: "#f6dcd8", letterSpacing: 1.4, textTransform: "uppercase", marginTop: 3 },
  cuerpo: { paddingHorizontal: 48 },
  titulo: { fontSize: 19, fontFamily: "Helvetica-Bold", lineHeight: 1.3, marginBottom: 2 },
  subtitulo: { fontSize: 10, color: GRIS, marginBottom: 14 },
  estado: {
    alignSelf: "flex-start",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 14,
  },
  ficha: { borderWidth: 1, borderColor: LINEA, borderRadius: 4, marginBottom: 18 },
  fichaFila: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINEA },
  fichaFilaUltima: { flexDirection: "row" },
  fichaCelda: { flex: 1, paddingVertical: 6, paddingHorizontal: 10 },
  fichaEtiqueta: { fontSize: 7.5, color: GRIS, textTransform: "uppercase", letterSpacing: 0.8 },
  fichaValor: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 1 },
  seccion: { marginBottom: 14 },
  seccionTitulo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ROJO,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: LINEA,
    paddingBottom: 4,
    marginBottom: 8,
  },
  texto: { fontSize: 10, color: "#222" },
  notas: { padding: 10, backgroundColor: "#faf6f1", borderLeftWidth: 3, borderLeftColor: ROJO },
  firma: { marginTop: 26, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  firmaBloque: { width: "55%" },
  firmaNombre: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 6 },
  firmaLinea: { borderTopWidth: 1, borderTopColor: TINTA, paddingTop: 4 },
  firmaDato: { fontSize: 8.5, color: GRIS },
  firmaElectronica: { fontSize: 13, fontFamily: "Helvetica-Oblique", color: ROJO, marginBottom: 2 },
  sello: {
    width: "38%",
    borderWidth: 1,
    borderColor: LINEA,
    borderRadius: 4,
    padding: 8,
  },
  pie: {
    position: "absolute",
    bottom: 26,
    left: 48,
    right: 48,
    fontSize: 7.5,
    color: "#888",
    borderTopWidth: 1,
    borderTopColor: LINEA,
    paddingTop: 6,
  },
});

/**
 * Helvetica (la fuente base del PDF) no trae algunos signos que usan los
 * informes: sin cambiarlos, «≥ 7» salía como «e 7».
 */
const SIN_GLIFO: [RegExp, string][] = [
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/→/g, "->"],
  [/−/g, "-"],
  [/═/g, "="],
  [/⚠️?/g, "(!)"],
];

export function textoPdf(texto: string): string {
  return SIN_GLIFO.reduce((t, [re, por]) => t.replace(re, por), texto);
}

export interface FirmaPsicologo {
  nombre: string;
  cedula?: string | null;
  /** Cuándo se validó y firmó. */
  fecha: string;
}

export interface InformePdfData {
  instrumento: string;
  participante: string;
  puesto?: string | null;
  empresa?: string | null;
  iniciada: string;
  /** Cuándo terminó de contestar; con esto el informe muestra la duración exacta. */
  finalizada?: string | null;
  interpretacion: string;
  notasPsicologo?: string | null;
  /** Generado al terminar, antes de que un psicólogo lo valide. */
  preliminar?: boolean;
  /** Quién firmó el informe validado. */
  firma?: FirmaPsicologo | null;
  /** Identificador del informe, para cotejarlo. */
  folio?: string;
}

/** El psicólogo responsable cuando la cuenta que validó no trae sus datos. */
export function psicologoResponsable(): { nombre: string | null; cedula: string | null } {
  return {
    nombre: process.env.PSICOLOGO_RESPONSABLE?.trim() || null,
    cedula: process.env.PSICOLOGO_CEDULA?.trim() || null,
  };
}

function Celda({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.fichaCelda}>
      <Text style={styles.fichaEtiqueta}>{etiqueta}</Text>
      <Text style={styles.fichaValor}>{valor}</Text>
    </View>
  );
}

export function InformePdfDocument({ data }: { data: InformePdfData }) {
  const prueba = SUBTITULO_INSTRUMENTO[data.instrumento as keyof typeof SUBTITULO_INSTRUMENTO] ?? data.instrumento;
  const [nombrePrueba, queMide] = prueba.split(" — ");
  const firmado = !data.preliminar && data.firma;

  return (
    <Document title={`Informe ${data.participante}`} author={APP_NAME} subject="Informe psicométrico">
      <Page size="A4" style={styles.page}>
        <View style={styles.banda} fixed>
          <Text style={styles.marca}>{APP_NAME}</Text>
          <Text style={styles.marcaSub}>Evaluación psicométrica · Informe profesional</Text>
        </View>

        <View style={styles.cuerpo}>
          <Text style={styles.titulo}>Informe de evaluación psicológica</Text>
          <Text style={styles.subtitulo}>
            {nombrePrueba}
            {queMide ? ` · ${queMide}` : ""}
          </Text>

          <Text
            style={[
              styles.estado,
              firmado
                ? { backgroundColor: "#e7f3ea", color: "#1f6b3a" }
                : { backgroundColor: "#fbf0e4", color: "#9a5a12" },
            ]}
          >
            {firmado ? "Validado y firmado por psicólogo" : "Preliminar · pendiente de firma del psicólogo"}
          </Text>

          <View style={styles.ficha}>
            <View style={styles.fichaFila}>
              <Celda etiqueta="Persona evaluada" valor={data.participante} />
              <Celda etiqueta="Puesto" valor={data.puesto || "—"} />
            </View>
            <View style={styles.fichaFila}>
              <Celda etiqueta="Empresa" valor={data.empresa || "—"} />
              <Celda etiqueta="Folio" valor={data.folio || "—"} />
            </View>
            {data.finalizada ? (
              <>
                <View style={styles.fichaFila}>
                  <Celda etiqueta="Inicio" valor={fechaHora(data.iniciada)} />
                  <Celda etiqueta="Fin" valor={fechaHora(data.finalizada)} />
                </View>
                <View style={styles.fichaFilaUltima}>
                  <Celda
                    etiqueta="Tiempo de respuesta"
                    valor={duracion(data.iniciada, data.finalizada) ?? "sin dato"}
                  />
                  <Celda etiqueta="Modalidad" valor="En línea, con código de acceso" />
                </View>
              </>
            ) : (
              <View style={styles.fichaFilaUltima}>
                <Celda etiqueta="Aplicación" valor={fechaHora(data.iniciada)} />
                <Celda etiqueta="Modalidad" valor="En línea, con código de acceso" />
              </View>
            )}
          </View>

          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Interpretación</Text>
            <Text style={styles.texto}>{textoPdf(data.interpretacion)}</Text>
          </View>

          {data.notasPsicologo?.trim() ? (
            <View style={styles.seccion} wrap={false}>
              <Text style={styles.seccionTitulo}>Observaciones del psicólogo</Text>
              <View style={styles.notas}>
                <Text style={styles.texto}>{textoPdf(data.notasPsicologo)}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.firma} wrap={false}>
            <View style={styles.firmaBloque}>
              {firmado ? <Text style={styles.firmaElectronica}>{data.firma!.nombre}</Text> : <Text> </Text>}
              <View style={styles.firmaLinea}>
                <Text style={styles.firmaNombre}>
                  {firmado ? data.firma!.nombre : "Psicólogo responsable"}
                </Text>
                <Text style={styles.firmaDato}>
                  {firmado
                    ? data.firma!.cedula
                      ? `Cédula profesional ${data.firma!.cedula}`
                      : "Psicólogo responsable"
                    : "Firma pendiente: este informe aún no ha sido validado"}
                </Text>
                {firmado ? (
                  <Text style={styles.firmaDato}>Firmado el {fechaHora(data.firma!.fecha)}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.sello}>
              <Text style={styles.firmaDato}>
                {firmado
                  ? "Un psicólogo revisó las respuestas, la calificación y la interpretación de este informe y lo firma como válido."
                  : "Generado al terminar la prueba. Un psicólogo lo revisa y te enviamos la versión firmada."}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.pie} fixed>
          {APP_NAME} · Documento confidencial, solo para el uso autorizado.
        </Text>
      </Page>
    </Document>
  );
}
