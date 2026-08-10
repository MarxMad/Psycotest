"use client";

import { motion } from "framer-motion";

interface ProgressStripProps {
  pct: number;
  accent?: string;
  children: React.ReactNode;
}

export function ProgressStrip({ pct, accent, children }: ProgressStripProps) {
  return (
    <div className="progress-strip">
      <div className="progress-strip-track">
        <motion.div
          className="progress-strip-fill"
          style={{ background: accent ?? "var(--accent)" }}
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="progress-strip-meta">{children}</div>
    </div>
  );
}
