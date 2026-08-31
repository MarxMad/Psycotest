"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import s from "./admin-layout.module.css";

interface AuthUser {
  nombre: string;
  email: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className={s.loading}>
        <div className={s.loadingSpinner} />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className={s.adminLayout}>
      <Sidebar user={user} onLogout={handleLogout} />
      <main className={s.mainContent}>{children}</main>
    </div>
  );
}
