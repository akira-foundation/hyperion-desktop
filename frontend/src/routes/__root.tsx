import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppShell } from "@/layouts/AppShell";
import { useAppliedTheme } from "@/hooks/use-applied-theme";

function RootLayout() {
  useAppliedTheme();
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <TanStackRouterDevtools position="bottom-right" />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout });
