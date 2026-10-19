"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { channelPublicUrl, type ChannelDef, type ChannelId } from "@/lib/channels";
import type { ChannelHero, ChannelPageContent, ChannelSection } from "@/lib/channel-content";
import s from "../canales.module.css";

export default function CanalEditorPage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [channel, setChannel] = useState<ChannelDef | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [hero, setHero] = useState<ChannelHero | null>(null);
  const [sections, setSections] = useState<ChannelSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/channels/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Canal no encontrado" : "No se pudo cargar el canal");
          setLoading(false);
          return;
        }
        const data = (await res.json()) as { channel: ChannelDef; page: ChannelPageContent };
        setChannel(data.channel);
        setSeoTitle(data.page.seoTitle);
        setSeoDescription(data.page.seoDescription);
        setPublished(data.page.published);
        setHero(data.page.hero);
        setSections(data.page.sections);
      } catch {
        setError("Error de red al cargar el canal");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!hero) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle,
          seoDescription,
          published,
          hero,
          sections,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus({ ok: false, text: data.error || "No se pudo guardar" });
      } else {
        const data = (await res.json()) as { page: ChannelPageContent };
        setHero(data.page.hero);
        setSections(data.page.sections);
        setStatus({ ok: true, text: "Guardado" });
      }
    } catch {
      setStatus({ ok: false, text: "Error de red al guardar" });
    }
    setSaving(false);
  }

  function updateHero<K extends keyof ChannelHero>(key: K, value: ChannelHero[K]) {
    setHero((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateSection(index: number, patch: Partial<ChannelSection>) {
    setSections((prev) => prev.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)));
  }

  if (loading) {
    return (
      <div className={s.container}>
        <Card>
          <div className={s.loading}>Cargando editor…</div>
        </Card>
      </div>
    );
  }

  if (error || !channel || !hero) {
    return (
      <div className={s.container}>
        <PageHeader
          title="Canal"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Canales", href: "/admin/canales" },
            { label: id },
          ]}
        />
        <Card>
          <div className={s.error}>{error || "Canal no disponible"}</div>
          <Link href="/admin/canales" className="btn">
            Volver a canales
          </Link>
        </Card>
      </div>
    );
  }

  const preview = channelPublicUrl(channel.id as ChannelId);

  return (
    <div className={s.container}>
      <PageHeader
        title={channel.name}
        subtitle={`${channel.hostPrefix}. · ${channel.tagline}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Canales", href: "/admin/canales" },
          { label: channel.name },
        ]}
        action={
          <a href={preview} target="_blank" rel="noopener noreferrer" className="btn">
            <ExternalLink size={16} />
            Vista previa
          </a>
        }
      />

      <form className={s.editor} onSubmit={onSave}>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Publicación y SEO</h3>
          <div className={s.formGrid}>
            <div className={`${s.field} ${s.fieldFull}`}>
              <label htmlFor="seoTitle">Título SEO</label>
              <input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                required
              />
            </div>
            <div className={`${s.field} ${s.fieldFull}`}>
              <label htmlFor="seoDescription">Descripción SEO</label>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                required
              />
            </div>
            <label className={s.toggle}>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Publicado en el subdominio
            </label>
          </div>
        </div>

        <div className={s.panel}>
          <h3 className={s.panelTitle}>Hero</h3>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label htmlFor="brand">Marca</label>
              <input
                id="brand"
                value={hero.brand}
                onChange={(e) => updateHero("brand", e.target.value)}
                required
              />
            </div>
            <div className={s.field}>
              <label htmlFor="image">Imagen (ruta pública)</label>
              <input
                id="image"
                value={hero.image || ""}
                onChange={(e) => updateHero("image", e.target.value)}
                placeholder="/ige/banner.png"
              />
            </div>
            <div className={`${s.field} ${s.fieldFull}`}>
              <label htmlFor="headline">Headline</label>
              <input
                id="headline"
                value={hero.headline}
                onChange={(e) => updateHero("headline", e.target.value)}
                required
              />
            </div>
            <div className={`${s.field} ${s.fieldFull}`}>
              <label htmlFor="lead">Lead</label>
              <textarea
                id="lead"
                value={hero.lead}
                onChange={(e) => updateHero("lead", e.target.value)}
                required
              />
            </div>
            <div className={s.field}>
              <label htmlFor="cta1label">CTA primario — texto</label>
              <input
                id="cta1label"
                value={hero.primaryCta.label}
                onChange={(e) =>
                  updateHero("primaryCta", { ...hero.primaryCta, label: e.target.value })
                }
                required
              />
            </div>
            <div className={s.field}>
              <label htmlFor="cta1href">CTA primario — href</label>
              <input
                id="cta1href"
                value={hero.primaryCta.href}
                onChange={(e) =>
                  updateHero("primaryCta", { ...hero.primaryCta, href: e.target.value })
                }
                required
              />
            </div>
            <div className={s.field}>
              <label htmlFor="cta2label">CTA secundario — texto</label>
              <input
                id="cta2label"
                value={hero.secondaryCta.label}
                onChange={(e) =>
                  updateHero("secondaryCta", { ...hero.secondaryCta, label: e.target.value })
                }
                required
              />
            </div>
            <div className={s.field}>
              <label htmlFor="cta2href">CTA secundario — href</label>
              <input
                id="cta2href"
                value={hero.secondaryCta.href}
                onChange={(e) =>
                  updateHero("secondaryCta", { ...hero.secondaryCta, href: e.target.value })
                }
                required
              />
            </div>
          </div>
        </div>

        <div className={s.panel}>
          <h3 className={s.panelTitle}>Secciones</h3>
          {sections.map((sec, index) => (
            <div key={sec.id} className={s.sectionBlock}>
              <h4>
                #{sec.id}
              </h4>
              <div className={s.formGrid}>
                <div className={s.field}>
                  <label>Eyebrow</label>
                  <input
                    value={sec.eyebrow || ""}
                    onChange={(e) => updateSection(index, { eyebrow: e.target.value })}
                  />
                </div>
                <div className={s.field}>
                  <label>Título</label>
                  <input
                    value={sec.title}
                    onChange={(e) => updateSection(index, { title: e.target.value })}
                    required
                  />
                </div>
                <div className={`${s.field} ${s.fieldFull}`}>
                  <label>Cuerpo</label>
                  <textarea
                    value={sec.body}
                    onChange={(e) => updateSection(index, { body: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={s.rowActions}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <Link href="/admin/canales" className="btn">
            Volver
          </Link>
          {status && (
            <span className={`${s.statusMsg} ${status.ok ? s.statusOk : s.statusErr}`}>
              {status.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
