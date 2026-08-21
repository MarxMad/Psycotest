import Link from "next/link";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_NAME } from "@/lib/brand";
import { psycotest } from "@/lib/routes";
import { BrandDot, TopNav } from "../TopNav";

export default function ClinicalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <header className="topbar">
        <div className="topbar-in">
          <Link href={psycotest.home} className="brand" title={APP_NAME}>
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
      {children}
    </AppProviders>
  );
}
