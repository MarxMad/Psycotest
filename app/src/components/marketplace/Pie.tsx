import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { CATEGORIAS } from "@/lib/ceduct/config";
import { CONTACTO, tel, whatsapp } from "@/lib/contacto";
import { RUTAS } from "@/lib/ceduct/rutas";
import { Emblema, IconoFacebook, IconoInstagram, IconoLinkedin, IconoYoutube } from "./Iconos";
import s from "./mk.module.css";

/**
 * Las URLs de redes son marcadores: sustitúyelas por los perfiles reales
 * (o borra la línea de la red que no exista).
 */
const REDES = [
  { label: "Facebook", href: "https://www.facebook.com/", Icono: IconoFacebook },
  { label: "Instagram", href: "https://www.instagram.com/", Icono: IconoInstagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/", Icono: IconoLinkedin },
  { label: "YouTube", href: "https://www.youtube.com/", Icono: IconoYoutube },
];

export function Pie() {
  const anio = new Date().getFullYear();
  return (
    <footer className={s.pie}>
      <div className={s.contenedor}>
        <div className={s.pieRejilla}>
          <div className={s.pieMarca}>
            <Link href={RUTAS.inicio()} className={s.marca} aria-label="CEDUCT, inicio">
              <Emblema className={s.marcaIcono} />
              <span className={s.marcaTexto}>
                <strong>CEDUCT</strong>
                <small>Competencias laborales</small>
              </span>
            </Link>
            <p>
              Centro de Educación y Capacitación para los Trabajadores, A.C. Entidad de
              Certificación y Evaluación acreditada ante CONOCER, clave ECE 002-10.
            </p>
            <div className={s.redes}>
              {REDES.map(({ label, href, Icono }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`CEDUCT en ${label}`}>
                  <Icono />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className={s.pieTitulo}>Catálogo</p>
            <ul className={s.pieLista}>
              <li><Link href={RUTAS.catalogo({ tipo: "diplomado" })}>Diplomados</Link></li>
              <li><Link href={RUTAS.catalogo({ tipo: "certificacion" })}>Certificaciones</Link></li>
              {CATEGORIAS.slice(0, 4).map((c) => (
                <li key={c.slug}>
                  <Link href={RUTAS.catalogo({ categoria: c.slug })}>{c.nombre}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={s.pieTitulo}>CEDUCT</p>
            <ul className={s.pieLista}>
              <li><Link href={RUTAS.nosotros}>Nosotros</Link></li>
              <li><Link href={RUTAS.empresas}>Para empresas</Link></li>
              <li><Link href={RUTAS.verificar}>Verificar un certificado</Link></li>
              <li><Link href={RUTAS.misCursos}>Mis cursos</Link></li>
              <li><Link href={RUTAS.contacto}>Contacto</Link></li>
            </ul>
          </div>

          <div>
            <p className={s.pieTitulo}>Hablemos</p>
            <ul className={s.pieLista}>
              <li>
                <a href={whatsapp("Hola, quiero información sobre los programas de CEDUCT.")} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} aria-hidden /> WhatsApp
                </a>
              </li>
              <li>
                <a href={tel()}>
                  <Phone size={16} aria-hidden /> {CONTACTO.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACTO.email}`}>
                  <Mail size={16} aria-hidden /> {CONTACTO.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={s.pieLegal}>
          <p>© {anio} CEDUCT A.C. Todos los derechos reservados.</p>
          <nav aria-label="Legal">
            <Link href={RUTAS.legal}>Aviso de privacidad</Link>
            <Link href={RUTAS.legal}>Términos y condiciones</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
