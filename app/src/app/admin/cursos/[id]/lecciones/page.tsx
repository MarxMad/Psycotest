"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "../../cursos.module.css";

type LessonRow = {
  lesson: {
    id: string;
    title: string;
    slug: string;
    type: string;
    videoUrl: string | null;
    freePreview: boolean;
    sortOrder: number;
  };
  quiz: { id: string; passScore: number; maxAttempts: number } | null;
  questions: Array<{ id: string; prompt: string; correctKeys: string[] }>;
};

type ModuleRow = {
  module: { id: string; title: string; sortOrder: number };
  lessons: LessonRow[];
};

export default function AdminCourseLessonsPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [curriculum, setCurriculum] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonForm, setLessonForm] = useState({
    moduleId: "",
    title: "",
    slug: "",
    type: "video" as "video" | "quiz" | "live_replay",
    videoUrl: "",
  });
  const [questionForm, setQuestionForm] = useState({
    lessonId: "",
    prompt: "",
    options: "a|Sí\nb|No",
    correctKeys: "a",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/courses/${courseId}/curriculum`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error al cargar");
      return;
    }
    setCurriculum(data.curriculum ?? []);
    if (data.curriculum?.[0]?.module?.id) {
      setLessonForm((f) => ({ ...f, moduleId: f.moduleId || data.curriculum[0].module.id }));
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addModule() {
    setError("");
    const res = await fetch(`/api/admin/courses/${courseId}/curriculum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "module", title: moduleTitle }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo crear módulo");
      return;
    }
    setModuleTitle("");
    await load();
  }

  async function addLesson() {
    setError("");
    const res = await fetch(`/api/admin/courses/${courseId}/curriculum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "lesson",
        moduleId: lessonForm.moduleId,
        title: lessonForm.title,
        slug: lessonForm.slug,
        type: lessonForm.type,
        videoUrl: lessonForm.videoUrl || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo crear lección");
      return;
    }
    setLessonForm((f) => ({ ...f, title: "", slug: "", videoUrl: "" }));
    await load();
  }

  async function addQuestion() {
    setError("");
    const options = questionForm.options
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split("|");
        return { key: key.trim(), label: rest.join("|").trim() || key.trim() };
      });
    const correctKeys = questionForm.correctKeys.split(",").map((k) => k.trim()).filter(Boolean);
    const res = await fetch(`/api/admin/courses/${courseId}/curriculum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "question",
        lessonId: questionForm.lessonId,
        prompt: questionForm.prompt,
        options,
        correctKeys,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo crear pregunta");
      return;
    }
    setQuestionForm((f) => ({ ...f, prompt: "" }));
    await load();
  }

  const quizLessons = curriculum.flatMap((m) =>
    m.lessons.filter((l) => l.lesson.type === "quiz").map((l) => l.lesson),
  );

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminHeader}>
        <div>
          <Link href={`/admin/cursos/${courseId}`}>← Volver al curso</Link>
          <h1>Currículo y quizzes</h1>
          <p>Crea módulos, lecciones (video/quiz) y preguntas con validación.</p>
        </div>
      </div>

      {error ? <p className={styles.errorText}>{error}</p> : null}
      {loading ? <p>Cargando…</p> : null}

      <section className={styles.adminCard}>
        <h2>Currículo actual</h2>
        {curriculum.length === 0 ? <p>Sin módulos aún.</p> : null}
        {curriculum.map((block) => (
          <div key={block.module.id} className={styles.curriculumBlock}>
            <h3>
              {block.module.title}{" "}
              <small className={styles.muted}>({block.module.id.slice(0, 8)})</small>
            </h3>
            <ul>
              {block.lessons.map(({ lesson, quiz, questions }) => (
                <li key={lesson.id}>
                  <strong>
                    [{lesson.type}] {lesson.title}
                  </strong>
                  {quiz ? (
                    <span className={styles.muted}>
                      {" "}
                      · quiz {quiz.passScore}% / {questions.length} preguntas
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className={styles.adminCard}>
        <h2>Nuevo módulo</h2>
        <div className={styles.formRow}>
          <input
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Título del módulo"
          />
          <button type="button" className={styles.btnPrimary} onClick={addModule}>
            Agregar módulo
          </button>
        </div>
      </section>

      <section className={styles.adminCard}>
        <h2>Nueva lección</h2>
        <div className={styles.formGrid}>
          <label>
            Módulo
            <select
              value={lessonForm.moduleId}
              onChange={(e) => setLessonForm((f) => ({ ...f, moduleId: e.target.value }))}
            >
              <option value="">Selecciona…</option>
              {curriculum.map((b) => (
                <option key={b.module.id} value={b.module.id}>
                  {b.module.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select
              value={lessonForm.type}
              onChange={(e) =>
                setLessonForm((f) => ({
                  ...f,
                  type: e.target.value as "video" | "quiz" | "live_replay",
                }))
              }
            >
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
              <option value="live_replay">Replay en vivo</option>
            </select>
          </label>
          <label>
            Título
            <input
              value={lessonForm.title}
              onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label>
            Slug
            <input
              value={lessonForm.slug}
              onChange={(e) => setLessonForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </label>
          {lessonForm.type === "video" ? (
            <label>
              URL video
              <input
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))}
              />
            </label>
          ) : null}
        </div>
        <button type="button" className={styles.btnPrimary} onClick={addLesson}>
          Agregar lección
        </button>
      </section>

      <section className={styles.adminCard}>
        <h2>Nueva pregunta de quiz</h2>
        <div className={styles.formGrid}>
          <label>
            Lección quiz
            <select
              value={questionForm.lessonId}
              onChange={(e) => setQuestionForm((f) => ({ ...f, lessonId: e.target.value }))}
            >
              <option value="">Selecciona…</option>
              {quizLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pregunta
            <input
              value={questionForm.prompt}
              onChange={(e) => setQuestionForm((f) => ({ ...f, prompt: e.target.value }))}
            />
          </label>
          <label>
            Opciones (una por línea: clave|texto)
            <textarea
              rows={4}
              value={questionForm.options}
              onChange={(e) => setQuestionForm((f) => ({ ...f, options: e.target.value }))}
            />
          </label>
          <label>
            Claves correctas (coma)
            <input
              value={questionForm.correctKeys}
              onChange={(e) => setQuestionForm((f) => ({ ...f, correctKeys: e.target.value }))}
            />
          </label>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={addQuestion}>
          Agregar pregunta
        </button>
      </section>
    </div>
  );
}
