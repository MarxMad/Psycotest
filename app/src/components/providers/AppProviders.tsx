"use client";

import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import { cancelFrame, frame } from "framer-motion";
import { useEffect, useRef } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "lenis/dist/lenis.css";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  return (
    <ThemeProvider>
      <ReactLenis
        root
        options={{ autoRaf: false, lerp: 0.085, smoothWheel: true }}
        ref={lenisRef}
      >
        {children}
      </ReactLenis>
    </ThemeProvider>
  );
}
