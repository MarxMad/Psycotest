import type { Metadata } from "next";
import { CeductShell } from "../diplomados/CeductShell";
import { FormularioInscripcion } from "./FormularioInscripcion";

export const metadata: Metadata = {
  title: "Inscripción — CEDUCT",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <CeductShell>
      <FormularioInscripcion />
    </CeductShell>
  );
}
