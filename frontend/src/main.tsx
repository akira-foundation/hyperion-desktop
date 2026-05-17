import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { queryClient } from "@/lib/query-client";
import { RenderEntry } from "./render-entry";
import "./styles/globals.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

const params = new URLSearchParams(window.location.search);
const renderTemplate = params.get("render");

if (renderTemplate) {
  document.body.style.background = "transparent";
  createRoot(container).render(
    <RenderEntry templateId={renderTemplate} encodedProps={params.get("props") ?? ""} />,
  );
} else {
  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
