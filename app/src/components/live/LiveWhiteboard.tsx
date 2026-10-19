"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import styles from "./LiveWhiteboard.module.css";

type Props = {
  liveClassId: string;
  breakoutRoomId?: string | null;
  /** El instructor dibuja; el resto ve la pizarra y se le actualiza sola. */
  isAdmin?: boolean;
};

type Documento = {
  documentJson?: Record<string, unknown> | null;
  updatedAt?: string | null;
};

const ESPERA_GUARDADO = 1500;
const ESPERA_REFRESCO = 6000;

export function LiveWhiteboard({ liveClassId, breakoutRoomId, isAdmin = false }: Props) {
  const editorRef = useRef<Editor | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Marca del documento sobre el que estamos trabajando: detecta pisadas. */
  const base = useRef<string | null>(null);
  /** Mientras cargamos o aplicamos cambios ajenos, no se guarda nada. */
  const silencio = useRef(true);

  const [inicial, setInicial] = useState<Documento | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);

  const ruta = useCallback(
    (extra = "") => {
      const q = breakoutRoomId
        ? `?breakoutRoomId=${encodeURIComponent(breakoutRoomId)}${extra ? `&${extra}` : ""}`
        : extra
          ? `?${extra}`
          : "";
      return `/api/live-classes/${liveClassId}/whiteboard${q}`;
    },
    [liveClassId, breakoutRoomId],
  );

  /**
   * El documento se trae ANTES de montar el lienzo.
   *
   * Antes se montaba vacío y se cargaba después: lo que alguien dibujara en
   * ese hueco lo borraba `loadSnapshot` al llegar la respuesta, y el guardado
   * siguiente mandaba la pizarra vacía al servidor. Eso perdía el trabajo.
   */
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch(ruta());
        if (!vivo) return;
        if (!res.ok) {
          setFallo("No se pudo cargar la pizarra");
          return;
        }
        const data = await res.json();
        setInicial({
          documentJson: data.document?.documentJson ?? null,
          updatedAt: data.document?.updatedAt ?? null,
        });
      } catch {
        if (vivo) setFallo("No se pudo cargar la pizarra");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [ruta]);

  const guardar = useCallback(
    async (editor: Editor) => {
      if (!isAdmin) return;
      const snapshot = getSnapshot(editor.store);
      try {
        const res = await fetch(ruta(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentJson: snapshot,
            breakoutRoomId: breakoutRoomId || null,
            baseUpdatedAt: base.current,
          }),
        });

        if (res.status === 409) {
          // Otra pestaña del instructor guardó encima. Se avisa en vez de
          // pisarlo en silencio, que es como se pierde una clase entera.
          setEstado("Otro dispositivo actualizó la pizarra · recarga para verla");
          return;
        }
        if (!res.ok) {
          setEstado("Error al guardar");
          return;
        }
        const data = await res.json();
        base.current = data.document?.updatedAt ?? base.current;
        setEstado("Guardado");
      } catch {
        setEstado("Sin conexión · se reintentará");
      }
    },
    [isAdmin, ruta, breakoutRoomId],
  );

  const onMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // El documento ya está en memoria: se aplica de golpe, sin ventana en
      // la que el usuario pueda dibujar sobre algo que luego se reemplaza.
      if (inicial?.documentJson) {
        try {
          loadSnapshot(editor.store, inicial.documentJson as never);
        } catch {
          /* instantánea inválida: se empieza en blanco */
        }
      }
      base.current = inicial?.updatedAt ?? null;

      if (!isAdmin) {
        editor.updateInstanceState({ isReadonly: true });
        silencio.current = true;
        return;
      }

      silencio.current = false;
      editor.store.listen(
        () => {
          if (silencio.current) return;
          if (temporizador.current) clearTimeout(temporizador.current);
          temporizador.current = setTimeout(() => void guardar(editor), ESPERA_GUARDADO);
        },
        { source: "user", scope: "document" },
      );
    },
    [inicial, isAdmin, guardar],
  );

  // Quien mira recibe los trazos del instructor sin tener que recargar.
  useEffect(() => {
    if (isAdmin || !inicial) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(ruta());
        if (!res.ok) return;
        const data = await res.json();
        const marca = data.document?.updatedAt ?? null;
        if (!marca || marca === base.current) return;
        const editor = editorRef.current;
        if (!editor || !data.document?.documentJson) return;
        silencio.current = true;
        try {
          // Solo el documento: cargar también la sesión arrastraría la cámara
          // y la herramienta del instructor, y le movería la vista a quien
          // está mirando cada seis segundos.
          const entrante = data.document.documentJson as { document?: unknown };
          loadSnapshot(
            editor.store,
            (entrante?.document ? { document: entrante.document } : entrante) as never,
          );
          editor.updateInstanceState({ isReadonly: true });
        } catch {
          /* instantánea inválida: se deja la que ya estaba */
        }
        base.current = marca;
      } catch {
        /* un fallo de red no debe romper la clase */
      }
    }, ESPERA_REFRESCO);
    return () => clearInterval(t);
  }, [isAdmin, inicial, ruta]);

  // Al cerrar se guarda lo que quedó pendiente en el temporizador.
  useEffect(() => {
    return () => {
      if (!temporizador.current) return;
      clearTimeout(temporizador.current);
      temporizador.current = null;
      const editor = editorRef.current;
      if (editor && isAdmin && !silencio.current) void guardar(editor);
    };
  }, [guardar, isAdmin]);

  async function capturar() {
    const editor = editorRef.current;
    if (!editor) return;
    setEstado("Capturando…");
    try {
      const formas = [...editor.getCurrentPageShapeIds()];
      if (formas.length === 0) {
        setEstado("Dibuja algo en la pizarra antes de capturar");
        return;
      }
      const resultado = await editor.toImage(formas, { format: "png", background: true, scale: 1 });
      const lector = new FileReader();
      const dataUrl = await new Promise<string>((resolver, rechazar) => {
        lector.onload = () => resolver(String(lector.result));
        lector.onerror = rechazar;
        lector.readAsDataURL(resultado.blob);
      });

      if (dataUrl.length > 2_400_000) {
        setEstado("Captura demasiado grande; reduce el contenido de la pizarra");
        return;
      }

      const res = await fetch(ruta(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "snapshot",
          imageData: dataUrl,
          breakoutRoomId: breakoutRoomId || null,
          label: `Pizarra ${new Date().toLocaleString("es-MX")}`,
        }),
      });
      setEstado(res.ok ? "Captura guardada" : "Error al capturar");
    } catch {
      setEstado("No se pudo generar la captura");
    }
  }

  if (fallo) {
    return <p className={styles.loading}>{fallo}</p>;
  }

  if (!inicial) {
    return <p className={styles.loading}>Cargando pizarra…</p>;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => editorRef.current && void guardar(editorRef.current)}
            >
              Guardar ahora
            </button>
            <button type="button" onClick={() => void capturar()}>
              Captura (screenshot)
            </button>
          </>
        ) : (
          <span className={styles.status}>
            Dibuja el instructor · se actualiza sola
          </span>
        )}
        {estado && <span className={styles.status}>{estado}</span>}
        <span className={styles.badge}>{isAdmin ? "Instructor" : "Solo lectura"}</span>
      </div>
      <div className={styles.canvas} data-lectura={!isAdmin}>
        <Tldraw onMount={onMount} />
      </div>
    </div>
  );
}
