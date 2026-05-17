import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { useAppliedTheme } from "@/hooks/use-applied-theme";

function RootLayout() {
  useAppliedTheme();
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({ component: RootLayout });
