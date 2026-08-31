"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Shield, Mail } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { User } from "@/db/schema";
import s from "./usuarios.module.css";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Link href="/admin/usuarios/roles" className="btn">
            <Shield size={16} />
            Gestionar Roles
          </Link>
        }
      />

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
                        {user.rol === "admin"
                          ? "Administrador"
                          : user.rol === "psicologo"
                            ? "Psicólogo"
                            : "Aplicador"}
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
