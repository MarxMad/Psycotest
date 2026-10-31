"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Shield, Mail } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { User } from "@/db/schema";
import { ROLES, type Rol } from "@/lib/auth-rutas";
import s from "./usuarios.module.css";

const ROL_NOMBRE: Record<Rol, string> = {
  admin: "Administrador",
  psicologo: "Psicólogo",
  aplicador: "Aplicador",
  cliente: "Cliente",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [alta, setAlta] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", rol: "psicologo" as Rol });
  const [enviando, setEnviando] = useState(false);
  const [errorAlta, setErrorAlta] = useState("");

  async function darDeAlta(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorAlta("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsuarios((us) => [data.user, ...us]);
        setNuevo({ nombre: "", email: "", rol: "psicologo" });
        setAlta(false);
      } else {
        setErrorAlta(data.error ?? "No se pudo dar de alta");
      }
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsuarios(data.users || []);
        }
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
      setLoading(false);
    }
    load();
  }, []);

  const stats = {
    total: usuarios.length,
    verificados: usuarios.filter((u) => u.emailVerified).length,
    admins: usuarios.filter((u) => u.rol === "admin").length,
  };

  return (
    <div className={s.container}>
      <PageHeader
        title="Usuarios"
        subtitle="Gestiona usuarios y permisos de la plataforma"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Usuarios" }]}
        action={
          <div className={s.headerActions}>
            <Link href="/admin/usuarios/roles" className="btn">
              <Shield size={16} />
              Gestionar Roles
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => setAlta((v) => !v)}>
              <UserPlus size={16} />
              Dar de alta
            </button>
          </div>
        }
      />

      {alta && (
        <Card className={s.altaCard}>
          <form className={s.alta} onSubmit={darDeAlta}>
            <label className={s.altaCampo}>
              <span>Nombre</span>
              <input
                className={s.altaInput}
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                required
              />
            </label>
            <label className={s.altaCampo}>
              <span>Correo</span>
              <input
                className={s.altaInput}
                type="email"
                value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                required
              />
            </label>
            <label className={s.altaCampo}>
              <span>Rol</span>
              <select
                className={s.altaInput}
                value={nuevo.rol}
                onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Rol })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROL_NOMBRE[r]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? "Guardando..." : "Crear cuenta"}
            </button>
          </form>
          <p className={s.muted}>
            No se envía correo: avísale que entre con &ldquo;Entrar con mi correo&rdquo; usando esta dirección y
            tendrá el rol asignado.
          </p>
          {errorAlta && (
            <p role="alert" className={s.altaError}>
              {errorAlta}
            </p>
          )}
        </Card>
      )}

      <div className={s.statsGrid}>
        <StatCard label="Total Usuarios" value={stats.total} icon={<Users size={24} />} color="blue" />
        <StatCard
          label="Verificados"
          value={stats.verificados}
          icon={<Mail size={24} />}
          color="green"
        />
        <StatCard
          label="Administradores"
          value={stats.admins}
          icon={<Shield size={24} />}
          color="purple"
        />
      </div>

      {loading ? (
        <Card>
          <div className={s.loading}>
            <div className={s.spinner} />
            <p>Cargando usuarios...</p>
          </div>
        </Card>
      ) : usuarios.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={48} />}
            title="Sin usuarios"
            description="Los usuarios registrados aparecerán aquí"
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.nombre}</strong>
                    </td>
                    <td className={s.muted}>{user.email}</td>
                    <td>
                      <span className={`${s.badge} ${s[`badge-${user.rol}`]}`}>
                        {ROL_NOMBRE[user.rol]}
                      </span>
                    </td>
                    <td>
                      {user.emailVerified ? (
                        <span className={s.verified}>Verificado</span>
                      ) : (
                        <span className={s.pending}>Pendiente</span>
                      )}
                    </td>
                    <td className={s.muted}>
                      {new Date(user.createdAt).toLocaleDateString("es-MX")}
                    </td>
                    <td>
                      <Link href={`/admin/usuarios/${user.id}`} className="btn btn-sm">
                        Ver Perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
