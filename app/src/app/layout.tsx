import type { Metadata } from "next";
import Script from "next/script";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { serif, sans } from "@/lib/fonts";
import { SiteChrome } from "./SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  // Cada dominio sirve el ícono de su marca (ver /api/marca).
  icons: {
    icon: [
      { url: "/api/marca/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/api/marca/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/api/marca/apple-icon.png", sizes: "180x180" },
  },
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
