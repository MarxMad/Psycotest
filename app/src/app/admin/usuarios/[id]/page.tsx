"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { ROLES, type Rol } from "@/lib/auth-rutas";
import s from "../usuarios.module.css";
import p from "./perfil.module.css";

type Perfil = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  emailVerified: boolean;
  createdAt: string;
  acceso: "correo" | "contrasena" | "pendiente";
};
type CursoInscrito = {
  id: string;
  status: string;
  progressPercent: number;
  createdAt: string;
  courseId: string;
  courseTitle: string;
};
type Pedido = { id: string; total: number; status: string; createdAt: string };

const ROL_NOMBRE: Record<Rol, string> = {
  admin: "Administrador",
  psicologo: "Psicólogo",
  aplicador: "Aplicador",
  cliente: "Cliente",
};

const ACCESO: Record<Perfil["acceso"], string> = {
  correo: "Entra con su correo",
  contrasena: "Entra con contraseña",
  pendiente: "Aún no ha entrado",
};

const ESTADO_CURSO: Record<string, string> = {
  pending: "Pago pendiente",
  active: "Cursando",
  completed: "Terminado",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
};

const ESTADO_PEDIDO: Record<string, string> = {
  pending: "Pendiente",
  completed: "Pagado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export default function PerfilUsuarioPage() {
  const { id } = useParams<{ id: string }>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cursos, setCursos] = useState<CursoInscrito[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>("cliente");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPerfil(data.user);
          setNombre(data.user.nombre);
          setRol(data.user.rol);
          setCursos(data.cursos ?? []);
          setPedidos(data.pedidos ?? []);
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    }
    load();
  }, [id]);

  async function guardar(cambios: { nombre?: string; rol?: Rol }) {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPerfil((u) => (u ? { ...u, ...data.user } : u));
        setRol(data.user.rol);
        setAviso({ tipo: "ok", texto: "Cambios guardados" });
      } else {
        setAviso({ tipo: "error", texto: data.error ?? "No se pudo guardar" });
        if (perfil) setRol(perfil.rol);
      }
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <Card>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Cargando usuario...</p>
        </div>
      </Card>
    );
  }

  if (!perfil) {
    return (
      <Card>
        <EmptyState title="Usuario no encontrado" description="La cuenta que buscas no existe" />
      </Card>
    );
  }

  const cambiado = nombre.trim() !== perfil.nombre || rol !== perfil.rol;

  return (
    <div className={s.container}>
      <PageHeader
        title={perfil.nombre}
        subtitle={perfil.email}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Usuarios", href: "/admin/usuarios" },
          { label: perfil.nombre },
        ]}
      />

      <div className={p.grid}>
        <Card>
          <CardHeader title="Cuenta" />
          <form
            className={p.form}
            onSubmit={(e) => {
              e.preventDefault();
              void guardar({ nombre: nombre.trim(), rol });
            }}
          >
            <label className={p.campo}>
              <span>Nombre</span>
              <input className={p.input} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label className={p.campo}>
              <span>Rol</span>
              <select className={p.input} value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROL_NOMBRE[r]}
                  </option>
                ))}
              </select>
            </label>
            {aviso && (
              <p role="status" className={aviso.tipo === "ok" ? p.ok : p.error}>
                {aviso.texto}
              </p>
            )}
            <div className={p.acciones}>
              {perfil.rol !== "cliente" && (
                <button
                  type="button"
                  className="btn"
                  disabled={guardando}
                  onClick={() => void guardar({ rol: "cliente" })}
                  title="Pasa a cliente: deja de entrar al panel, conserva sus cursos y pedidos"
                >
                  Quitar acceso al panel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={guardando || !cambiado}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Datos" />
          <dl className={p.datos}>
            <dt>Correo</dt>
            <dd>{perfil.email}</dd>
            <dt>Acceso</dt>
            <dd>{ACCESO[perfil.acceso]}</dd>
            <dt>Correo verificado</dt>
            <dd>{perfil.emailVerified ? "Sí" : "No"}</dd>
            <dt>Alta</dt>
            <dd>{new Date(perfil.createdAt).toLocaleDateString("es-MX")}</dd>
          </dl>
        </Card>
      </div>

      <Card padding="none" className={p.bloque}>
        <div className={p.seccion}>
          <CardHeader title="Cursos" subtitle={`${cursos.length} inscripciones`} />
        </div>
        {cursos.length === 0 ? (
          <p className={`${s.muted} ${p.vacio}`}>Sin cursos.</p>
        ) : (
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/cursos/${c.courseId}`}>{c.courseTitle}</Link>
                    </td>
                    <td>{ESTADO_CURSO[c.status] ?? c.status}</td>
                    <td>{c.progressPercent}%</td>
                    <td className={s.muted}>{new Date(c.createdAt).toLocaleDateString("es-MX")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="none" className={p.bloque}>
        <div className={p.seccion}>
          <CardHeader title="Pedidos" subtitle={`${pedidos.length} pedidos`} />
        </div>
        {pedidos.length === 0 ? (
          <p className={`${s.muted} ${p.vacio}`}>Sin pedidos.</p>
        ) : (
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((o) => (
                  <tr key={o.id}>
                    <td className={s.muted}>{o.id}</td>
                    <td>${(o.total / 100).toLocaleString("es-MX")} MXN</td>
                    <td>{ESTADO_PEDIDO[o.status] ?? o.status}</td>
                    <td className={s.muted}>{new Date(o.createdAt).toLocaleDateString("es-MX")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
