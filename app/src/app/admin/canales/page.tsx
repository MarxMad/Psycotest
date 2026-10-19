"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { channelPublicUrl, type ChannelDef, type ChannelId } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import s from "./canales.module.css";

type ChannelRow = ChannelDef & { page: ChannelPageContent | null };

export default function CanalesAdminPage() {
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/channels");
        if (!res.ok) {
          setError(res.status === 401 ? "No autorizado" : "No se pudieron cargar los canales");
          setLoading(false);
          return;
        }
        const data = (await res.json()) as { channels: ChannelRow[] };
        setChannels(data.channels || []);
      } catch {
        setError("Error de red al cargar canales");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className={s.container}>
      <PageHeader
        title="Canales"
        subtitle="Contenido y SEO de los cuatro sitios por subdominio"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Canales" }]}
      />

      {loading && (
        <Card>
          <div className={s.loading}>Cargando canales…</div>
        </Card>
      )}

      {error && (
        <Card>
          <div className={s.error}>{error}</div>
        </Card>
      )}

      {!loading && !error && (
        <div className={s.grid}>
          {channels.map((ch) => {
            const published = ch.page?.published ?? false;
            const preview = channelPublicUrl(ch.id as ChannelId);
            return (
              <Link key={ch.id} href={`/admin/canales/${ch.id}`} className={s.card}>
                <div className={s.cardTop}>
                  <div>
                    <h3 className={s.cardTitle}>{ch.name}</h3>
                    <p className={s.cardTag}>
                      {ch.hostPrefix}. · {ch.accentLabel}
                    </p>
                  </div>
                  <span className={`${s.badge} ${published ? s.badgeOn : s.badgeOff}`}>
                    {published ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <p className={s.cardDesc}>{ch.description}</p>
                <div className={s.meta}>
                  <span>{ch.tagline}</span>
                  <span
                    className={s.previewLink}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(preview, "_blank", "noopener,noreferrer");
                    }}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(preview, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <ExternalLink size={12} style={{ display: "inline", verticalAlign: "-1px" }} />{" "}
                    Vista previa
                  </span>
                </div>
              </Link>
            );
          })}
          {channels.length === 0 && (
            <Card>
              <div className={s.loading}>
                <Globe2 size={28} style={{ marginBottom: 8 }} />
                No hay canales registrados
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
