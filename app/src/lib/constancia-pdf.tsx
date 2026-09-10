import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { APP_NAME } from "./brand";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  border: {
    borderWidth: 2,
    borderColor: "#0f3d3e",
    padding: 32,
    minHeight: 700,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#0f3d3e",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#0f3d3e",
  },
  subtitle: {
    fontSize: 11,
    color: "#444",
    marginBottom: 24,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 12,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  meta: {
    fontSize: 9,
    color: "#555",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    alignItems: "flex-end",
  },
  qr: {
    width: 96,
    height: 96,
  },
  footer: {
    marginTop: 24,
    fontSize: 8,
    color: "#777",
  },
});

export type ConstanciaPdfData = {
  folio: string;
  participantName: string;
  courseTitle: string;
  programCode: string;
  programTitle: string;
  issuedAt: string;
  aprovechamientoPercent: number;
  presencePercentAvg: number;
  verificationUrl: string;
  verificationCode: string;
  qrDataUrl?: string;
  dictamenText?: string;
};

export function ConstanciaPdfDocument({ data }: { data: ConstanciaPdfData }) {
  const issued = new Date(data.issuedAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.brand}>{APP_NAME} · Certificación CONOCER</Text>
          <Text style={styles.title}>Constancia de participación</Text>
          <Text style={styles.subtitle}>{data.programTitle}</Text>

          <Text style={styles.body}>Se otorga la presente constancia a:</Text>
          <Text style={styles.name}>{data.participantName}</Text>
          <Text style={styles.body}>
            Por haber cubierto los requisitos del programa {data.programCode} correspondiente al
            curso «{data.courseTitle}».
          </Text>
          <Text style={styles.body}>
            Aprovechamiento: {data.aprovechamientoPercent}% · Presencia en vivo:{" "}
            {data.presencePercentAvg}%
          </Text>
          {data.dictamenText ? <Text style={styles.body}>{data.dictamenText}</Text> : null}

          <View style={styles.row}>
            <View>
              <Text style={styles.meta}>Folio: {data.folio}</Text>
              <Text style={styles.meta}>Código: {data.verificationCode}</Text>
              <Text style={styles.meta}>Emitida: {issued}</Text>
            </View>
            {data.qrDataUrl ? <Image src={data.qrDataUrl} style={styles.qr} /> : null}
          </View>

          <Text style={styles.footer}>
            Verifique autenticidad en {data.verificationUrl}. Documento generado electrónicamente.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
