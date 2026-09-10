import { ConsultorioAnime } from "@/components/consultorio/ConsultorioAnime";
import styles from "./consultorio.module.css";

/** Shell de marca compartido: landing, cursos, ingreso, CONOCER */
export function BrandShell({ children }: { children: React.ReactNode }) {
  return (
    <ConsultorioAnime>
      <div className={styles.root}>{children}</div>
    </ConsultorioAnime>
  );
}
