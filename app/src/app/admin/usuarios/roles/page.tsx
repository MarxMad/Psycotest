"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader } from "@/components/admin/Card";
import { Badge, DataTable, type Columna } from "@/components/admin/DataTable";
import s from "./roles.module.css";

type Rol = "admin" | "psicologo" | "aplicador";

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  emailVerified: boolean;
  createdAt: string;
};

const ROLES: { id: Rol; label: string; descripcion: string }[] = [
  {
    id: "admin",
    label: "Administrador",
    descripcion: "Acceso total: usuarios, cursos, pagos, canales y configuración.",
  },
  {
    id: "psicologo",
    label: "Psicólogo",
    descripcion: "Aplica y califica evaluaciones, emite códigos y revisa expedientes.",
  },
  {
    id: "aplicador",
    label: "Aplicador",
    descripcion: "Solo acompaña la aplicación de pruebas; no ve resultados ni interpretaciones.",
  },
];

const TONO: Record<Rol, "danger" | "info" | "neutral"> = {
  admin: "danger",
  psicologo: "info",
  aplicador: "neutral",
};

const LABEL: Record<Rol, string> = {
  admin: "Administrador",
  psicologo: "Psicólogo",
  aplicador: "Aplicador",
};

export default function RolesPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/users");
      if (!r.ok) throw new Error("No se pudieron cargar los usuarios");
      const d = await r.json();
      setUsuarios(d.users ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function cambiarRol(u: Usuario, rol: Rol) {
    if (rol === u.rol) return;
    setGuardando(u.id);
    setError(null);
    setAviso(null);
    try {
      const r = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo cambiar el rol");
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol } : x)));
      setAviso(`${u.nombre} ahora es ${LABEL[rol]}.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(null);
    }
  }

  const columnas: Columna<Usuario>[] = [
    {
      header: "Usuario",
      cell: (u) => (
        <div>
          <strong>{u.nombre}</strong>
          <div className={s.sub}>{u.email}</div>
        </div>
      ),
    },
    {
      header: "Verificado",
      cell: (u) =>
        u.emailVerified ? <Badge tone="success">Sí</Badge> : <Badge tone="warn">Pendiente</Badge>,
      align: "center",
    },
    {
      header: "Rol actual",
      cell: (u) => <Badge tone={TONO[u.rol]}>{LABEL[u.rol]}</Badge>,
      align: "center",
    },
    {
      header: "Cambiar a",
      cell: (u) => (
        <select
          className={s.select}
          value={u.rol}
          disabled={guardando === u.id}
          onChange={(e) => cambiarRol(u, e.target.value as Rol)}
          aria-label={`Rol de ${u.nombre}`}
        >
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      ),
      align: "end",
    },
  ];

  return (
    <div className={s.container}>
      <PageHeader
        title="Roles y permisos"
        subtitle="Define qué puede hacer cada persona dentro del panel"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Usuarios", href: "/admin/usuarios" },
          { label: "Roles" },
        ]}
      />

      {error && <div className={s.error}>{error}</div>}
      {aviso && <div className={s.aviso}>{aviso}</div>}

      <Card>
        <CardHeader title="Qué puede hacer cada rol" />
        <ul className={s.leyenda}>
          {ROLES.map((r) => (
            <li key={r.id}>
              <ShieldCheck size={17} aria-hidden />
              <div>
                <strong>{r.label}</strong>
                <p>{r.descripcion}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="none">
        {loading ? (
          <p className={s.cargando}>Cargando usuarios…</p>
        ) : (
          <DataTable
            columns={columnas}
            rows={usuarios}
            rowKey={(u) => u.id}
            empty="No hay usuarios registrados."
          />
        )}
      </Card>
    </div>
  );
}
