import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CommandPalette } from "@/features/palette/CommandPalette";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="drag flex h-full w-full gap-2 p-2"
      style={{
        background:
          "radial-gradient(120% 80% at 0% 0%, rgba(56,189,248,0.03) 0%, transparent 55%), radial-gradient(120% 80% at 100% 100%, rgba(168,85,247,0.03) 0%, transparent 55%), rgba(10,10,12,0.30)",
      }}
    >
      <Sidebar />
      <main className="no-drag relative flex-1 overflow-hidden">
        <div className="h-full overflow-auto">{children}</div>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <OnboardingWizard />
    </div>
  );
}
