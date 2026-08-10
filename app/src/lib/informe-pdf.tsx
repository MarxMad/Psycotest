import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { APP_NAME } from "./brand";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 12,
  },
  brand: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#444",
    marginBottom: 2,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  body: {
    fontSize: 10,
    color: "#222",
    whiteSpace: "pre-wrap",
  },
  notas: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#888",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 8,
  },
});

const INSTRUMENTO_LABEL: Record<string, string> = {
  papi: "PAPI — Personality and Preference Inventory",
  hartman: "Inventario de Valores Hartman",
  mabe: "MABE — Managerial Behavior Evaluation",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface InformePdfData {
  instrumento: string;
  participante: string;
  puesto?: string | null;
  empresa?: string | null;
  iniciada: string;
  interpretacion: string;
  notasPsicologo?: string | null;
}

export function InformePdfDocument({ data }: { data: InformePdfData }) {
  const contexto = [data.puesto, data.empresa].filter(Boolean).join(" · ");

  return (
    <Document
      title={`Informe ${data.participante}`}
      author={APP_NAME}
      subject="Informe psicométrico"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.title}>Informe de evaluación</Text>
          <Text style={styles.meta}>
            {INSTRUMENTO_LABEL[data.instrumento] ?? data.instrumento.toUpperCase()}
          </Text>
          <Text style={styles.meta}>Participante: {data.participante}</Text>
          {contexto ? <Text style={styles.meta}>{contexto}</Text> : null}
          <Text style={styles.meta}>Aplicación: {fmt(data.iniciada)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interpretación</Text>
          <Text style={styles.body}>{data.interpretacion}</Text>
        </View>

        {data.notasPsicologo?.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones del psicólogo</Text>
            <View style={styles.notas}>
              <Text style={styles.body}>{data.notasPsicologo}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Documento generado por {APP_NAME}. Uso confidencial — solo para fines clínicos
          autorizados.
        </Text>
      </Page>
    </Document>
  );
}
