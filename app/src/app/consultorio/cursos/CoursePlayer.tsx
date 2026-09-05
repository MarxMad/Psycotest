"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./cursos.module.css";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  type?: "video" | "quiz" | "live_replay";
  durationSeconds: number;
  freePreview: boolean;
  progress: { completed: boolean; lastPositionSeconds: number } | null;
};

type Module = {
  module: { id: string; title: string };
  lessons: Lesson[];
};

type QuizQuestion = {
  id: string;
  prompt: string;
  type: "single" | "multiple" | "true_false";
  options: Array<{ key: string; label: string }>;
};

type QuizPayload = {
  quiz: {
    id: string;
    passScore: number;
    maxAttempts: number;
  };
  questions: QuizQuestion[];
  attemptsUsed: number;
  attemptsRemaining: number;
  bestAttempt: { score: number; passed: boolean; attemptNumber: number } | null;
};

type GradeResult = {
  ok: true;
  score: number;
  passed: boolean;
  passScore: number;
  attemptsRemaining: number;
  breakdown: Array<{
    questionId: string;
    correct: boolean;
    correctKeys: string[];
    explanation: string | null;
  }>;
};

type Props = {
  courseSlug: string;
  courseTitle: string;
  currentLessonId: string;
  lessonType: "video" | "quiz" | "live_replay";
  curriculum: Module[];
  videoUrl: string | null;
  quizId: string | null;
  progressPercent: number;
};

export function CoursePlayer({
  courseSlug,
  courseTitle,
  currentLessonId,
  lessonType,
  curriculum,
  videoUrl,
  quizId,
  progressPercent,
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [marking, setMarking] = useState(false);
  const [percent, setPercent] = useState(progressPercent);

  const [quizData, setQuizData] = useState<QuizPayload | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [quizError, setQuizError] = useState("");

  useEffect(() => {
    setPercent(progressPercent);
    setResult(null);
    setAnswers({});
    setQuizError("");
  }, [currentLessonId, progressPercent]);

  useEffect(() => {
    if (lessonType !== "quiz" || !quizId) {
      setQuizData(null);
      return;
    }
    let cancelled = false;
    setQuizLoading(true);
    void fetch(`/api/courses/quizzes/${quizId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el quiz");
        if (!cancelled) setQuizData(data as QuizPayload);
      })
      .catch((err: Error) => {
        if (!cancelled) setQuizError(err.message);
      })
      .finally(() => {
        if (!cancelled) setQuizLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonType, quizId]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || lessonType !== "video") return;
    const onTimeUpdate = () => {
      if (v.currentTime > 0 && Math.floor(v.currentTime) % 15 === 0) {
        void fetch("/api/courses/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseSlug,
            lessonId: currentLessonId,
            positionSeconds: Math.floor(v.currentTime),
          }),
        });
      }
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [courseSlug, currentLessonId, lessonType]);

  async function markComplete() {
    setMarking(true);
    const res = await fetch("/api/courses/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug, lessonId: currentLessonId, completed: true }),
    });
    const data = (await res.json()) as { progressPercent?: number };
    if (typeof data.progressPercent === "number") setPercent(data.progressPercent);
    setMarking(false);
    router.refresh();
  }

  const toggleAnswer = useCallback((questionId: string, key: string, multiple: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multiple) {
        const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [key] };
    });
  }, []);

  async function submitQuiz() {
    if (!quizId) return;
    setSubmitting(true);
    setQuizError("");
    const res = await fetch(`/api/courses/quizzes/${quizId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setQuizError(data.error ?? "No se pudo enviar");
      return;
    }
    if (data.ok) {
      setResult(data as GradeResult);
      if (typeof data.progressPercent === "number") setPercent(data.progressPercent);
      router.refresh();
    }
  }

  const allLessons = curriculum.flatMap((m) => m.lessons);
  const idx = allLessons.findIndex((l) => l.id === currentLessonId);
  const next = idx >= 0 ? allLessons[idx + 1] : undefined;
  const current = allLessons[idx];

  return (
    <div className={styles.playerLayout}>
      <aside className={styles.playerSidebar}>
        <div className={styles.playerSidebarHead}>
          <Link href={`/consultorio/cursos/${courseSlug}`} className={styles.backLink}>
            ← {courseTitle}
          </Link>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${percent}%` }} />
          </div>
          <p className={styles.progressLabel}>{percent}% completado</p>
        </div>
        <nav className={styles.lessonNav}>
          {curriculum.map((block) => (
            <div key={block.module.id} className={styles.moduleBlock}>
              <p className={styles.moduleTitle}>{block.module.title}</p>
              <ul>
                {block.lessons.map((item) => {
                  const done = item.progress?.completed;
                  const isQuiz = item.type === "quiz";
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/consultorio/cursos/${courseSlug}/aprender/${item.id}`}
                        className={`${styles.lessonLink}${item.id === currentLessonId ? ` ${styles.lessonActive}` : ""}`}
                      >
                        <span className={styles.lessonCheck}>{done ? "✓" : isQuiz ? "?" : "○"}</span>
                        <span>
                          {isQuiz ? "Quiz · " : ""}
                          {item.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className={styles.playerMain}>
        {lessonType === "quiz" ? (
          <div className={styles.quizPanel}>
            <h1 className={styles.quizTitle}>{current?.title ?? "Cuestionario"}</h1>
            {quizLoading ? <p className={styles.quizHint}>Cargando preguntas…</p> : null}
            {quizError ? <p className={styles.quizError}>{quizError}</p> : null}

            {quizData && !result ? (
              <>
                <p className={styles.quizMeta}>
                  Aprueba con {quizData.quiz.passScore}% · Intentos restantes:{" "}
                  {quizData.attemptsRemaining}
                  {quizData.bestAttempt
                    ? ` · Mejor: ${quizData.bestAttempt.score}%${quizData.bestAttempt.passed ? " (aprobado)" : ""}`
                    : ""}
                </p>
                <ol className={styles.quizList}>
                  {quizData.questions.map((q, i) => {
                    const multiple = q.type === "multiple";
                    const selected = answers[q.id] ?? [];
                    return (
                      <li key={q.id} className={styles.quizItem}>
                        <p className={styles.quizPrompt}>
                          {i + 1}. {q.prompt}
                        </p>
                        <div className={styles.quizOptions}>
                          {q.options.map((opt) => {
                            const active = selected.includes(opt.key);
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                className={`${styles.quizOption}${active ? ` ${styles.quizOptionActive}` : ""}`}
                                onClick={() => toggleAnswer(q.id, opt.key, multiple)}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={submitQuiz}
                  disabled={submitting || quizData.attemptsRemaining <= 0}
                >
                  {submitting ? "Calificando…" : "Enviar respuestas"}
                </button>
              </>
            ) : null}

            {result ? (
              <div className={styles.quizResult}>
                <p className={result.passed ? styles.quizPass : styles.quizFail}>
                  {result.passed ? "¡Aprobado!" : "No aprobado"} — {result.score}% (mínimo{" "}
                  {result.passScore}%)
                </p>
                <ul className={styles.quizBreakdown}>
                  {result.breakdown.map((b, i) => (
                    <li key={b.questionId}>
                      <strong>
                        Pregunta {i + 1}: {b.correct ? "Correcta" : "Incorrecta"}
                      </strong>
                      {b.explanation ? <span> — {b.explanation}</span> : null}
                    </li>
                  ))}
                </ul>
                {!result.passed && result.attemptsRemaining > 0 ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => {
                      setResult(null);
                      setAnswers({});
                    }}
                  >
                    Reintentar ({result.attemptsRemaining} restantes)
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className={styles.videoWrap}>
              {videoUrl ? (
                <video ref={videoRef} className={styles.video} controls src={videoUrl} playsInline />
              ) : (
                <div className={styles.videoPlaceholder}>
                  {lessonType === "live_replay" ? "Replay próximamente" : "Video próximamente"}
                </div>
              )}
            </div>
            <div className={styles.playerActions}>
              <button type="button" className={styles.btnPrimary} onClick={markComplete} disabled={marking}>
                {marking ? "Guardando…" : "Marcar como vista"}
              </button>
            </div>
          </>
        )}

        <div className={styles.playerActions}>
          {next ? (
            <Link
              href={`/consultorio/cursos/${courseSlug}/aprender/${next.id}`}
              className={styles.btnSecondary}
            >
              Siguiente →
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
