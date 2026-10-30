import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  SECCIONES_CANDIDATO,
  SECCIONES_INVESTIGADOR,
  TRANSFERENCIA,
  type Campo,
  type Fila,
  type Seccion,
  type Valor,
  type ValoresSeccion,
} from "@/data/socioeconomico";
import { APP_NAME } from "./brand";
import { filasDe, pesos, texto, type ResumenSocioeconomico, type RespuestasSocioeconomico } from "./socioeconomico";

const st = StyleSheet.create({
  page: { padding: 44, paddingBottom: 64, fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.4, color: "#1a1a1a" },
  marca: { fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase", color: "#666", marginBottom: 4 },
  titulo: { fontSize: 17, fontFamily: "Helvetica-Bold", lineHeight: 1.2, marginBottom: 8 },
  meta: { fontSize: 9, color: "#444", marginBottom: 1 },
  cabecera: { borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 10, marginBottom: 14 },
  cifras: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  cifra: { width: "33.3%", paddingVertical: 4, paddingRight: 8 },
  cifraEtiqueta: { fontSize: 7, color: "#666", textTransform: "uppercase", letterSpacing: 0.6 },
  cifraValor: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  parte: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6, color: "#5b2a69" },
  seccion: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4, color: "#333" },
  sub: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#666", marginTop: 4, marginBottom: 2 },
  pares: { flexDirection: "row", flexWrap: "wrap" },
  par: { width: "50%", paddingRight: 8, marginBottom: 3 },
  parAncho: { width: "100%", marginBottom: 3 },
  k: { fontSize: 7.5, color: "#666" },
  v: { fontSize: 9 },
  cuerpo: { fontSize: 9.5, lineHeight: 1.5 },
  vacio: { fontSize: 8.5, color: "#999" },
  pie: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    fontSize: 7,
    color: "#888",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export interface SocioeconomicoPdfData {
  participante: string;
  puesto?: string | null;
  empresa?: string | null;
  iniciada: string;
  respuestas: RespuestasSocioeconomico;
  resumen: ResumenSocioeconomico;
  interpretacion: string;
  notas?: string | null;
}

const ANCHOS: Campo["tipo"][] = ["textoLargo", "multiple"];

function Pares({ campos, fuente }: { campos: Campo[]; fuente: Fila | ValoresSeccion }) {
  const llenos = campos.filter((c) => texto(fuente[c.id] as Valor) !== "");
  if (!llenos.length) return null;
  return (
    <View style={st.pares}>
      {llenos.map((c) => (
        <View key={c.id} style={ANCHOS.includes(c.tipo) || c.ancho === "completo" ? st.parAncho : st.par} wrap={false}>
          <Text style={st.k}>{c.etiqueta}</Text>
          <Text style={st.v}>{texto(fuente[c.id] as Valor)}</Text>
        </View>
      ))}
    </View>
  );
}

function SeccionPdf({ seccion, valores }: { seccion: Seccion; valores: ValoresSeccion | undefined }) {
  const v = valores ?? {};
  const filas = filasDe(v, seccion);
  const algo =
    [...(seccion.campos ?? []), ...(seccion.camposFinales ?? [])].some((c) => texto(v[c.id] as Valor) !== "") ||
    filas.length > 0;
  return (
    <View>
      <Text style={st.seccion} minPresenceAhead={40}>
        {seccion.titulo}
      </Text>
      {!algo && <Text style={st.vacio}>Sin datos.</Text>}
      <Pares campos={seccion.campos ?? []} fuente={v} />
      {filas.map((f, i) => (
        <View key={i} wrap={false}>
          <Text style={st.sub}>
            {seccion.lista!.elemento} {i + 1}
          </Text>
          <Pares campos={seccion.lista!.campos} fuente={f} />
        </View>
      ))}
      <Pares campos={seccion.camposFinales ?? []} fuente={v} />
    </View>
  );
}

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

/** El expediente completo: resumen, lo del candidato, lo del investigador y el dictamen. */
export function SocioeconomicoPdfDocument({ data }: { data: SocioeconomicoPdfData }) {
  const { respuestas: r, resumen: res } = data;
  const contexto = [data.puesto, data.empresa].filter(Boolean).join(" · ");

  return (
    <Document title={`Estudio socioeconómico — ${data.participante}`} author={APP_NAME} subject="Estudio socioeconómico">
      <Page size="LETTER" style={st.page}>
        <View style={st.cabecera}>
          <Text style={st.marca}>{APP_NAME}</Text>
          <Text style={st.titulo}>Estudio Socioeconómico</Text>
          <Text style={st.meta}>Candidato: {data.participante}</Text>
          {contexto ? <Text style={st.meta}>{contexto}</Text> : null}
          <Text style={st.meta}>Fecha de captura: {fecha(data.iniciada)}</Text>
        </View>

        <View style={st.cifras}>
          {(
            [
              ["Ingresos mensuales", pesos(res.ingresos)],
              ["Egresos mensuales", pesos(res.egresos)],
              ["Diferencia", pesos(res.diferencia)],
              ["Referencias laborales", res.promedioReferencias != null ? `${res.promedioReferencias} / 10` : "—"],
              ["Dictamen", res.dictamen ?? "Pendiente"],
            ] as const
          ).map(([k, v]) => (
            <View key={k} style={st.cifra}>
              <Text style={st.cifraEtiqueta}>{k}</Text>
              <Text style={st.cifraValor}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={st.parte}>Informe</Text>
        <Text style={st.cuerpo}>{data.interpretacion}</Text>
        {data.notas?.trim() ? (
          <>
            <Text style={st.seccion}>Observaciones</Text>
            <Text style={st.cuerpo}>{data.notas}</Text>
          </>
        ) : null}

        <Text style={st.parte} break>
          Información del candidato
        </Text>
        {SECCIONES_CANDIDATO.map((sec) => (
          <SeccionPdf key={sec.id} seccion={sec} valores={r.candidato[sec.id]} />
        ))}

        <Text style={st.parte} break>
          Investigación
        </Text>
        {SECCIONES_INVESTIGADOR.map((sec) => (
          <SeccionPdf key={sec.id} seccion={sec} valores={r.investigador[sec.id]} />
        ))}

        <Text style={st.seccion}>Aviso de privacidad</Text>
        <Text style={st.cuerpo}>
          {r.aviso
            ? `Firmado por ${r.aviso.nombre} el ${fecha(r.aviso.fecha)}. ${TRANSFERENCIA[r.aviso.transferencia]}.`
            : "Sin aviso de privacidad firmado."}
        </Text>

        <View style={st.pie} fixed>
          <Text>Documento confidencial. Contiene datos personales sensibles; su uso se limita al proceso de selección.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
