import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { serif, sans } from "@/lib/fonts";
import { BrandDot, TopNav } from "./TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body>
        <AppProviders>
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
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
