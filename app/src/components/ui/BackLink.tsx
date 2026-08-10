"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function BackLink({ href = "/" }: { href?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} className="back-link">
        <ArrowLeft size={15} strokeWidth={2} aria-hidden />
        Volver
      </Link>
    </motion.div>
  );
}
