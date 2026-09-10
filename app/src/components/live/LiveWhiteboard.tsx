"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import styles from "./LiveWhiteboard.module.css";

type Props = {
  liveClassId: string;
  breakoutRoomId?: string | null;
  isAdmin?: boolean;
};

export function LiveWhiteboard({ liveClassId, breakoutRoomId, isAdmin }: Props) {
  const editorRef = useRef<Editor | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  const persist = useCallback(
    async (editor: Editor) => {
      try {
        const snapshot = getSnapshot(editor.store);
        const res = await fetch(`/api/live-classes/${liveClassId}/whiteboard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentJson: snapshot,
            breakoutRoomId: breakoutRoomId || null,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        setStatus("Guardado");
      } catch {
        setStatus("Error al guardar");
      }
    },
    [liveClassId, breakoutRoomId],
  );

  const onMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      setReady(true);

      void (async () => {
        const q = breakoutRoomId ? `?breakoutRoomId=${encodeURIComponent(breakoutRoomId)}` : "";
        const res = await fetch(`/api/live-classes/${liveClassId}/whiteboard${q}`);
        if (res.ok) {
          const data = await res.json();
          const doc = data.document?.documentJson;
          if (doc && !loadedRef.current) {
            try {
              loadSnapshot(editor.store, doc);
            } catch {
              /* snapshot inválido: pizarra vacía */
            }
            loadedRef.current = true;
          }
        }
      })();

      editor.store.listen(
        () => {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => void persist(editor), 2000);
        },
        { source: "user", scope: "document" },
      );
    },
    [liveClassId, breakoutRoomId, persist],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function takeSnapshot() {
    const editor = editorRef.current;
    if (!editor) return;
    setStatus("Capturando…");
    try {
      const shapeIds = [...editor.getCurrentPageShapeIds()];
      if (shapeIds.length === 0) {
        setStatus("Dibuja algo en la pizarra antes de capturar");
        return;
      }
      const result = await editor.toImage(shapeIds, { format: "png", background: true, scale: 1 });
      const blob = result.blob;
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (dataUrl.length > 2_400_000) {
        setStatus("Captura demasiado grande; reduce el contenido de la pizarra");
        return;
      }

      const res = await fetch(`/api/live-classes/${liveClassId}/whiteboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "snapshot",
          imageData: dataUrl,
          breakoutRoomId: breakoutRoomId || null,
          label: `Pizarra ${new Date().toLocaleString("es-MX")}`,
        }),
      });
      setStatus(res.ok ? "Captura guardada" : "Error al capturar");
    } catch {
      setStatus("No se pudo generar la captura");
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => editorRef.current && void persist(editorRef.current)}>
          Guardar ahora
        </button>
        <button type="button" onClick={() => void takeSnapshot()}>
          Captura (screenshot)
        </button>
        {status && <span className={styles.status}>{status}</span>}
        {isAdmin && <span className={styles.badge}>Instructor</span>}
      </div>
      <div className={styles.canvas}>
        <Tldraw onMount={onMount} />
      </div>
      {!ready && <p className={styles.loading}>Inicializando…</p>}
    </div>
  );
}
