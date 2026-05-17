import { useEffect, useState } from "react";
import { getTemplate } from "@/templates/registry";

interface RenderEntryProps {
  templateId: string;
  encodedProps: string;
}

export function RenderEntry({ templateId, encodedProps }: RenderEntryProps) {
  const [ready, setReady] = useState(false);

  const meta = getTemplate(templateId);
  let props: unknown = meta?.defaultProps;
  let parseError: string | null = null;

  if (meta && encodedProps) {
    try {
      const json = atob(encodedProps.replace(/-/g, "+").replace(/_/g, "/"));
      const raw = JSON.parse(json);
      const parsed = meta.schema.safeParse(raw);
      if (parsed.success) {
        props = parsed.data;
      } else {
        parseError = parsed.error.message;
      }
    } catch (e) {
      parseError = (e as Error).message;
    }
  }

  useEffect(() => {
    if (!meta || parseError) return;
    requestAnimationFrame(() => {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => setReady(true));
      });
    });
  }, [meta, parseError]);

  if (!meta) {
    return <div style={{ padding: 40, color: "#fff" }}>Unknown template: {templateId}</div>;
  }
  if (parseError) {
    return <div style={{ padding: 40, color: "#f87171" }}>Props error: {parseError}</div>;
  }

  const Component = meta.component;
  return (
    <div data-render-ready={ready ? "true" : "false"}>
      <Component {...(props as object)} />
    </div>
  );
}
