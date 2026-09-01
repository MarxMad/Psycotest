"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./cursos.module.css";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  durationSeconds: number;
  freePreview: boolean;
  progress: { completed: boolean; lastPositionSeconds: number } | null;
};

type Module = {
  module: { id: string; title: string };
  lessons: Lesson[];
};

type Props = {
  courseSlug: string;
  courseTitle: string;
  currentLessonId: string;
  curriculum: Module[];
  videoUrl: string | null;
  progressPercent: number;
};

export function CoursePlayer({
  courseSlug,
  courseTitle,
  currentLessonId,
  curriculum,
  videoUrl,
  progressPercent,
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
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
  }, [courseSlug, currentLessonId]);

  async function markComplete() {
    setMarking(true);
    await fetch("/api/courses/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug, lessonId: currentLessonId, completed: true }),
    });
    setMarking(false);
    router.refresh();
  }

  const allLessons = curriculum.flatMap((m) => m.lessons);
  const idx = allLessons.findIndex((l) => l.id === currentLessonId);
  const next = idx >= 0 ? allLessons[idx + 1] : undefined;

  return (
    <div className={styles.playerLayout}>
      <aside className={styles.playerSidebar}>
        <div className={styles.playerSidebarHead}>
          <Link href={`/consultorio/cursos/${courseSlug}`} className={styles.backLink}>
            ← {courseTitle}
          </Link>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <p className={styles.progressLabel}>{progressPercent}% completado</p>
        </div>
        <nav className={styles.lessonNav}>
          {curriculum.map((block) => (
            <div key={block.module.id} className={styles.moduleBlock}>
              <p className={styles.moduleTitle}>{block.module.title}</p>
              <ul>
                {block.lessons.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/consultorio/cursos/${courseSlug}/aprender/${item.id}`}
                      className={`${styles.lessonLink}${item.id === currentLessonId ? ` ${styles.lessonActive}` : ""}`}
                    >
                      <span className={styles.lessonCheck}>{item.progress?.completed ? "✓" : "○"}</span>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className={styles.playerMain}>
        <div className={styles.videoWrap}>
          {videoUrl ? (
            <video ref={videoRef} className={styles.video} controls src={videoUrl} playsInline />
          ) : (
            <div className={styles.videoPlaceholder}>Video próximamente</div>
          )}
        </div>
        <div className={styles.playerActions}>
          <button type="button" className={styles.btnPrimary} onClick={markComplete} disabled={marking}>
            {marking ? "Guardando…" : "Marcar como vista"}
          </button>
          {next ? (
            <Link href={`/consultorio/cursos/${courseSlug}/aprender/${next.id}`} className={styles.btnSecondary}>
              Siguiente clase →
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
