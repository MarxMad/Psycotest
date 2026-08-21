import styles from "./consultorio.module.css";

/** Shell de marca compartido: landing, cursos, ingreso */
export function BrandShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
