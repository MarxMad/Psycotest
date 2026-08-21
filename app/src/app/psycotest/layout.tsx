import { AppProviders } from "@/components/providers/AppProviders";
import { ClinicalHeader } from "@/components/site/ClinicalHeader";
import { BrandShell } from "../consultorio/BrandShell";

export default function ClinicalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <BrandShell>
        <ClinicalHeader />
        {children}
      </BrandShell>
    </AppProviders>
  );
}
