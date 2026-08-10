"use client";

import { useEffect, useRef } from "react";

interface Orb {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: number;
}

function getCtx(canvas: HTMLCanvasElement) {
  return canvas.getContext("2d");
}

function isDarkMode() {
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!getCtx(canvasRef.current)) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let orbs: Orb[] = [];

    function resize() {
      const canvas = canvasRef.current;
      const context = canvas ? getCtx(canvas) : null;
      if (!canvas || !context) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      orbs = [
        { x: 0.2, y: 0.25, r: 280, vx: 0.00008, vy: 0.00006, hue: 205 },
        { x: 0.75, y: 0.35, r: 320, vx: -0.00006, vy: 0.00009, hue: 155 },
        { x: 0.5, y: 0.72, r: 260, vx: 0.00005, vy: -0.00007, hue: 42 },
      ];
    }

    function draw() {
      const canvas = canvasRef.current;
      const context = canvas ? getCtx(canvas) : null;
      if (!canvas || !context) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      context.clearRect(0, 0, w, h);

      const isDark = isDarkMode();
      context.fillStyle = isDark ? "#131518" : "#f4f4f0";
      context.fillRect(0, 0, w, h);

      for (const orb of orbs) {
        if (!reduced) {
          orb.x += orb.vx;
          orb.y += orb.vy;
          if (orb.x < 0.1 || orb.x > 0.9) orb.vx *= -1;
          if (orb.y < 0.1 || orb.y > 0.9) orb.vy *= -1;
        }

        const cx = orb.x * w;
        const cy = orb.y * h;
        const grad = context.createRadialGradient(cx, cy, 0, cx, cy, orb.r);
        const alpha = isDark ? 0.14 : 0.11;
        grad.addColorStop(0, `hsla(${orb.hue}, 45%, ${isDark ? 55 : 45}%, ${alpha})`);
        grad.addColorStop(1, "transparent");
        context.fillStyle = grad;
        context.fillRect(cx - orb.r, cy - orb.r, orb.r * 2, orb.r * 2);
      }

      frame = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-bg" aria-hidden />;
}
