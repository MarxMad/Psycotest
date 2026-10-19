"use client";

import { PrivyProvider as Base } from "@privy-io/react-auth";
import type { ReactNode } from "react";

/**
 * Envoltura de Privy. Si no hay APP ID configurado no monta nada: la
 * aplicación sigue funcionando con el acceso por correo y contraseña.
 */
export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <>{children}</>;

  return (
    <Base
      appId={appId}
      config={{
        // Sólo correo: Google no está habilitado en la app de Privy.
        loginMethods: ["email"],
        appearance: { theme: "light", accentColor: "#3e5a6e" },
        // Sin wallets: no se crea ninguna al entrar.
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
          solana: { createOnLogin: "off" },
        },
      }}
    >
      {children}
    </Base>
  );
}
