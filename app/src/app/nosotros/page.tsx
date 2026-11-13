import { permanentRedirect } from "next/navigation";

/** La página "Nosotros" se retiró del sitio; los enlaces viejos llevan a la portada. */
export default function NosotrosPage() {
  permanentRedirect("/");
}
