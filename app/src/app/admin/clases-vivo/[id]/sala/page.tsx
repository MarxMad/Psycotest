import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import s from "../../clases-vivo.module.css";

type Props = { params: Promise<{ id: string }> };

export default async function LiveRoomStubPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className={s.container}>
      <PageHeader
        title="Sala en vivo"
        subtitle="Transmisión desde la plataforma — en preparación"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clases en Vivo", href: "/admin/clases-vivo" },
          { label: "Detalle", href: `/admin/clases-vivo/${id}` },
          { label: "Sala" },
        ]}
      />

      <Card>
        <div className={s.roomStub}>
          <h2>Próximamente: transmisión desde la plataforma</h2>
          <p>
            Esta sala se conectará a Jitsi self-hosted (cámara, micrófono, chat, hasta ~30
            participantes) según el plan de infraestructura. Por ahora puedes programar la clase y
            guardar metadatos / asistencia en la base de datos.
          </p>
          <p>
            Guía técnica: <code>docs/LIVE-JITSI.md</code>
          </p>
          <Link href={`/admin/clases-vivo/${id}`} className="btn">
            ← Volver al detalle
          </Link>
        </div>
      </Card>
    </div>
  );
}
