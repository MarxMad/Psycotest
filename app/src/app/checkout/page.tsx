import type { Metadata } from "next";
import { Checkout } from "@/components/marketplace/compra/Checkout";
import { MarketShell } from "@/components/marketplace/MarketShell";

export const metadata: Metadata = {
  title: "Pago — CEDUCT",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <MarketShell>
      <Checkout />
    </MarketShell>
  );
}
