"use client";

import { motion } from "framer-motion";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  accent?: string;
  delay?: number;
}

export function GlassPanel({ children, className = "", accent, delay = 0 }: GlassPanelProps) {
  return (
    <motion.div
      className={`glass-panel ${className}`.trim()}
      style={accent ? { ["--panel-accent" as string]: accent } : undefined}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
