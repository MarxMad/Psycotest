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
  const [permanence, setPermanence] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const send = (eventType: string, positionSeconds: number, completed?: boolean) => {
      void fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          lessonId: currentLessonId,
          eventType,
          positionSeconds,
          completed,
        }),
      }).then(async (res) => {
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (typeof data.permanencePercent === "number") {
          setPermanence(data.permanencePercent);
        }
        if (data.coupon?.code) setCouponCode(data.coupon.code);
      });
    };

    const onPlay = () => send("play", Math.floor(v.currentTime));
    const onPause = () => send("pause", Math.floor(v.currentTime));
    const onEnded = () => send("ended", Math.floor(v.duration || v.currentTime), true);
    const onTimeUpdate = () => {
      if (v.currentTime > 0 && Math.floor(v.currentTime) % 15 === 0) {
        send("heartbeat", Math.floor(v.currentTime));
      }
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [courseSlug, currentLessonId]);

  async function markComplete() {
    setMarking(true);
    const res = await fetch("/api/courses/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug, lessonId: currentLessonId, completed: true }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.coupon?.code) setCouponCode(data.coupon.code);
    }
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
          {permanence != null && (
            <p className={styles.progressLabel}>Permanencia VOD: {permanence}%</p>
          )}
          {couponCode && (
            <p className={styles.progressLabel}>
              Cupón 100%: <strong>{couponCode}</strong>
            </p>
          )}
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
