"use client";

import { usePathname } from "next/navigation";
import { ConsultorioNav } from "../ConsultorioNav";
import { BrandShell } from "../BrandShell";

export function CursosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlayer = pathname.includes("/aprender/");

  return (
    <BrandShell>
      {!isPlayer ? <ConsultorioNav /> : null}
      {children}
    </BrandShell>
  );
}
