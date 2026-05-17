import { useState } from "react";
import { Image as ImageIcon, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTemplates } from "@/templates/registry";
import type { AnyTemplateMeta } from "@/templates/types";
import { useRenderTemplate } from "@/services/render";
import { TemplatePreview } from "./TemplatePreview";

export function TemplatesPage() {
  const templates = listTemplates();
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const selected = templates.find((t) => t.id === selectedId);

  return (
    <div className="flex h-full">
      <aside className="w-[260px] shrink-0 overflow-y-auto border-r border-white/[0.06] px-3 py-4">
        <h2 className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-white/45">
          Templates
        </h2>
        <ul className="flex flex-col gap-px">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`group flex w-full flex-col rounded-[8px] px-2.5 py-2 text-left transition-colors ${
                  selectedId === t.id
                    ? "bg-white/[0.07] text-white"
                    : "text-white/75 hover:bg-white/[0.05]"
                }`}
              >
                <span className="text-[13px] font-medium">{t.name}</span>
                <span className="text-[11px] text-white/45">{t.category} · {t.aspectRatio}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {selected ? <TemplateDetail meta={selected} /> : null}
    </div>
  );
}

function TemplateDetail({ meta }: { meta: AnyTemplateMeta }) {
  const [props, setProps] = useState<Record<string, unknown>>(meta.defaultProps);
  const render = useRenderTemplate();

  function onRender() {
    render.mutate({
      templateId: meta.id,
      props,
      size: meta.size,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden bg-black/30 p-6">
        <TemplatePreview meta={meta} props={props} />
      </div>
      <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-white/[0.06] px-4 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white">{meta.name}</h2>
          <p className="mt-1 text-[12px] text-white/55">{meta.description}</p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <PropsEditor meta={meta} value={props} onChange={setProps} />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={onRender} disabled={render.isPending}>
            <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
            {render.isPending ? "Rendering..." : "Render PNG"}
          </Button>

          {render.error ? (
            <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{(render.error as Error).message}</span>
            </div>
          ) : null}

          {render.data && render.data.path ? (
            <div className="flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
              <Check className="mt-0.5 h-3 w-3 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span>Saved {(render.data.sizeBytes / 1024).toFixed(0)} KB</span>
                <span className="break-all font-mono text-[10.5px] text-white/55">
                  {render.data.path}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function PropsEditor({
  meta,
  value,
  onChange,
}: {
  meta: AnyTemplateMeta;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(meta.defaultProps as object).map(([key, defaultVal]) => (
        <PropField
          key={key}
          name={key}
          value={value[key] ?? defaultVal}
          onChange={(v) => onChange({ ...value, [key]: v })}
        />
      ))}
    </div>
  );
}

function PropField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
      {name}
    </span>
  );

  if (Array.isArray(value)) {
    return (
      <label className="block">
        {label}
        <textarea
          value={(value as string[]).join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
          rows={4}
          className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
        <span className="mt-0.5 block text-[10px] text-white/35">one per line</span>
      </label>
    );
  }
  if (typeof value === "string" && value.startsWith("#")) {
    return (
      <label className="flex items-center justify-between gap-2">
        {label}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-12 cursor-pointer rounded ring-0.5 ring-white/[0.08]"
        />
      </label>
    );
  }
  if (typeof value === "string" && value.length > 60) {
    return (
      <label className="block">
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
      </label>
    );
  }
  return (
    <label className="block">
      {label}
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md bg-white/[0.05] px-2.5 text-[12.5px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
      />
    </label>
  );
}
