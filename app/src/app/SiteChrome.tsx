"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_NAME } from "@/lib/brand";
import { BrandDot, TopNav } from "./TopNav";

function hideGlobalTopbar(pathname: string) {
  return pathname === "/" || pathname.startsWith("/consultorio");
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hide = hideGlobalTopbar(pathname);

  return (
    <AppProviders>
      {!hide ? (
        <header className="topbar">
          <div className="topbar-in">
            <Link href="/" className="brand" title={APP_NAME}>
              <BrandDot />
              <span className="brand-text">{APP_NAME}</span>
            </Link>
            <div className="topbar-actions">
              <ThemeToggle />
              <TopNav />
            </div>
            <span className="eyebrow topbar-eyebrow">Uso profesional</span>
          </div>
        </header>
      ) : null}
      {children}
    </AppProviders>
  );
}
