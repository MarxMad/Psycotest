import type { Metadata } from "next";
import Script from "next/script";
import { AppProviders } from "@/components/providers/AppProviders";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { serif, sans } from "@/lib/fonts";
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
      <body>{children}</body>
    </html>
  );
}
