"use client";

import { animate, stagger } from "animejs";

function markHidden(els: HTMLElement[]) {
  for (const el of els) {
    el.style.opacity = "0";
  }
}

export function animateEnter(
  targets: string | HTMLElement | HTMLElement[],
  opts?: { delay?: number; y?: number; duration?: number },
) {
  return animate(targets, {
    opacity: [0, 1],
    translateY: [opts?.y ?? 18, 0],
    ease: "out(3)",
    duration: opts?.duration ?? 700,
    delay: opts?.delay ?? 0,
  });
}

export function animateStagger(targets: HTMLElement[], opts?: { y?: number; duration?: number }) {
  return animate(targets, {
    opacity: [0, 1],
    translateY: [opts?.y ?? 22, 0],
    ease: "out(3)",
    duration: opts?.duration ?? 650,
    delay: stagger(70),
  });
}

/** Anima nodos data-anime / data-reveal / data-anime-stagger dentro de root. */
export function bindConsultorioAnime(root: HTMLElement): () => void {
  const immediate = root.querySelectorAll<HTMLElement>(
    '[data-anime="hero"], [data-anime="nav"], [data-anime="page"]',
  );
  markHidden([...immediate]);
  immediate.forEach((el, i) => {
    animateEnter(el, {
      delay: i * 50,
      y: el.dataset.anime === "nav" ? 8 : 16,
      duration: 620,
    });
  });

  const observers: IntersectionObserver[] = [];

  const scrollEls = root.querySelectorAll<HTMLElement>(
    '[data-anime="section"], [data-anime="card"], [data-reveal], [data-anime="hero-copy"]',
  );
  markHidden([...scrollEls]);
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        animateEnter(el, { y: 24, duration: 700 });
        io.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );
  scrollEls.forEach((el) => io.observe(el));
  observers.push(io);

  const lists = root.querySelectorAll<HTMLElement>("[data-anime-stagger]");
  const listIo = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const list = entry.target as HTMLElement;
        const kids = [...list.children] as HTMLElement[];
        markHidden(kids);
        animateStagger(kids);
        listIo.unobserve(list);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
  );
  lists.forEach((list) => listIo.observe(list));
  observers.push(listIo);

  return () => {
    observers.forEach((o) => o.disconnect());
  };
}
