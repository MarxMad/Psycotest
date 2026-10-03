import type { ReactNode } from "react";
import s from "./DataTable.module.css";

export type Columna<T> = {
  /** Encabezado de la columna */
  header: string;
  /** Contenido de la celda */
  cell: (row: T) => ReactNode;
  /** Alineación; por defecto a la izquierda */
  align?: "start" | "center" | "end";
  /** Usa cifras tabulares y evita el salto de línea */
  numeric?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Sin registros todavía.",
}: {
  columns: Columna<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className={s.wrap}>
        <p className={s.empty}>{empty}</p>
      </div>
    );
  }

  const claseAlineacion = (c: Columna<T>) =>
    [
      c.align === "end" ? s.alignEnd : c.align === "center" ? s.alignCenter : "",
      c.numeric ? s.numeric : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className={s.wrap}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={claseAlineacion(c)} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((c) => (
                <td key={c.header} className={claseAlineacion(c)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Tono = "neutral" | "success" | "warn" | "danger" | "info";

const TONO: Record<Tono, string> = {
  neutral: s.badgeNeutral,
  success: s.badgeSuccess,
  warn: s.badgeWarn,
  danger: s.badgeDanger,
  info: s.badgeInfo,
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tono }) {
  return <span className={`${s.badge} ${TONO[tone]}`}>{children}</span>;
}

export const tableStyles = s;
