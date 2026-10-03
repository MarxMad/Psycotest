/** Datos de contacto comerciales, compartidos por los cuatro canales. */

export const CONTACTO = {
  email: "martintlax@gmail.com",
  phone: "5580413220",
  phoneDisplay: "55 8041 3220",
  whatsappBase: "https://wa.me/525580413220",
} as const;

export function mailto(asunto: string) {
  return `mailto:${CONTACTO.email}?subject=${encodeURIComponent(asunto)}`;
}

export function whatsapp(mensaje: string) {
  return `${CONTACTO.whatsappBase}?text=${encodeURIComponent(mensaje)}`;
}

export function tel() {
  return `tel:+52${CONTACTO.phone}`;
}
