/**
 * Salida deliberada de la aplicación.
 *
 * La sesión de Privy es independiente de la nuestra: al pulsar «Salir» se
 * borraba solo la cookie de la aplicación, y la pantalla de acceso —que
 * canjea sola la sesión de Privy cuando sigue abierta— volvía a entrar sin
 * que nadie tocara nada. Este parámetro le avisa de que esta vez hay que
 * cerrar Privy también.
 *
 * Va en la URL y no en sessionStorage a propósito: sobrevive a una recarga y
 * funciona en ventanas privadas o con el almacenamiento bloqueado, donde la
 * marca se perdería y el bucle volvería.
 */
export const PARAM_SALIDA = "salir";

/** Destino de los botones de «Salir». */
export function rutaDeSalida(): string {
  return `/login?${PARAM_SALIDA}=1`;
}
