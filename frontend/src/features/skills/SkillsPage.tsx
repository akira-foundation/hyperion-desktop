import { useState } from "react";
import { Sparkles, FolderOpen, AlertCircle, Check, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkills, useRunSkill, pickProjectFolder } from "@/services/skills";
import { useSaveSkillResultAsTemplate } from "@/services/templates";
import type { skill } from "../../../wailsjs/go/models";

export function SkillsPage() {
  const skillsQuery = useSkills();
  const skills = skillsQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string>("");
  const selected = skills.find((s) => s.id === selectedId);

  return (
    <div className="flex h-full gap-2">
      <aside className="w-[300px] shrink-0 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2">
          <h2 className="text-[15px] font-semibold text-white">Skills</h2>
          <p className="mt-0.5 text-[11.5px] text-white/55">
            AI workflows that generate branded content from your projects.
          </p>
        </div>

        {skillsQuery.isLoading ? (
          <div className="px-2 py-1 text-[12px] text-white/45">Loading...</div>
        ) : skills.length === 0 ? (
          <div className="px-2 py-1 text-[12px] text-white/45">No skills installed.</div>
        ) : (
          <ul className="flex flex-col gap-px">
            {skills.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`group flex w-full flex-col rounded-[8px] px-2.5 py-2 text-left transition-colors ${
                    selectedId === s.id
                      ? "bg-white/[0.07] text-white"
                      : "text-white/75 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-[13px] font-medium">{s.name}</span>
                  <span className="line-clamp-2 text-[11px] text-white/45">
                    {s.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {selected ? <SkillDetail skill={selected} /> : <EmptyDetail />}
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-[20px] bg-black/30 text-[13px] text-white/45 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
      Select a skill to begin.
    </div>
  );
}

function SkillDetail({ skill: s }: { skill: skill.Skill }) {
  const [projectPath, setProjectPath] = useState<string>("");
  const run = useRunSkill();

  async function onPickFolder() {
    const path = await pickProjectFolder();
    if (path) setProjectPath(path);
  }

  function onRun() {
    if (!projectPath) return;
    run.mutate({
      skillId: s.id,
      projectPath,
      provider: "claude-cli",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-black/30 rounded-[20px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
      <header className="border-b border-white/[0.06] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-(--color-primary)" />
              <h1 className="text-[17px] font-semibold tracking-tight text-white">{s.name}</h1>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
                {s.category}
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-white/65">{s.description}</p>
            {s.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10.5px] text-white/55 ring-0.5 ring-white/[0.06]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden gap-2">
        <div className="flex w-[380px] shrink-0 flex-col gap-3 px-5 py-5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
              Project folder
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="/Users/you/dev/myproject"
                className="h-9 flex-1 rounded-md bg-white/[0.05] px-2.5 text-[12.5px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
              />
              <button
                type="button"
                onClick={onPickFolder}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white/[0.05] text-white/65 ring-0.5 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                title="Pick folder"
              >
                <FolderOpen className="h-4 w-4" />
              </button>
            </div>
          </label>

          <Button onClick={onRun} disabled={!projectPath || run.isPending}>
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            {run.isPending ? "Running..." : "Run skill"}
          </Button>

          {run.error ? (
            <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{(run.error as Error).message}</span>
            </div>
          ) : null}

          {run.data ? (
            <div className="flex flex-col gap-2 rounded-md bg-emerald-500/10 p-2.5 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
              <div className="flex items-start gap-1.5">
                <Check className="mt-0.5 h-3 w-3 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span>{run.data.files.length} files generated</span>
                  <span className="break-all font-mono text-[10.5px] text-white/55">
                    {run.data.outputDir}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-auto px-5 py-5">
          {run.data ? (
            <RunResult result={run.data} />
          ) : (
            <div className="flex h-full items-center justify-center text-[12.5px] text-white/40">
              Output appears here after the skill runs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RunResult({ result }: { result: skill.RunResult }) {
  return (
    <div className="flex flex-col gap-4">
      <SaveAsTemplateCard result={result} />
      {result.caption ? (
        <section className="rounded-lg bg-white/[0.03] p-4 ring-0.5 ring-white/[0.06]">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Caption
          </h3>
          <pre className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-white/85">
            {result.caption}
          </pre>
        </section>
      ) : null}

      <section className="rounded-lg bg-white/[0.03] p-4 ring-0.5 ring-white/[0.06]">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">
          Generated files ({result.files.length})
        </h3>
        <ul className="flex flex-col gap-1.5">
          {result.files.map((f) => (
            <li
              key={f.path}
              className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-white/75 ring-0.5 ring-white/[0.04]"
            >
              <FileIconFor kind={f.kind} />
              <span className="flex-1 truncate font-mono">{f.path.split("/").pop()}</span>
              <span className="text-[10.5px] tabular-nums text-white/40">
                {(f.size / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      </section>

      {result.log ? (
        <details className="rounded-lg bg-white/[0.03] p-3 ring-0.5 ring-white/[0.06]">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Run log
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-white/65">
            {result.log}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function SaveAsTemplateCard({ result }: { result: skill.RunResult }) {
  const [name, setName] = useState<string>(() => {
    const base = result.outputDir.split("/").pop() ?? "";
    return base.replace(/^marketing\./, "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  });
  const [description, setDescription] = useState("Generated via Instagram Carousel skill");
  const save = useSaveSkillResultAsTemplate();

  function onSave() {
    if (!name.trim()) return;
    save.mutate({
      outputDir: result.outputDir,
      name: name.trim(),
      description: description.trim(),
      category: "Marketing",
      size: { width: 1080, height: 1080 },
    });
  }

  return (
    <section className="rounded-lg bg-(--color-primary)/[0.08] p-4 ring-0.5 ring-(--color-primary)/30">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-(--color-primary)">
        Save as template
      </h3>
      <p className="mb-3 text-[12px] text-white/65">
        Register this output as a reusable template in your library.
      </p>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[12.5px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[12.5px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
        <Button onClick={onSave} disabled={!name.trim() || save.isPending}>
          <Save className="h-4 w-4" strokeWidth={2.25} />
          {save.isPending ? "Saving..." : "Save as template"}
        </Button>
        {save.error ? (
          <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{(save.error as Error).message}</span>
          </div>
        ) : null}
        {save.data ? (
          <div className="flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
            <Check className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Saved as <strong>{save.data.name}</strong> — see Templates page.
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FileIconFor({ kind }: { kind: string }) {
  return <FileText className={`h-3.5 w-3.5 ${colorFor(kind)}`} />;
}

function colorFor(kind: string): string {
  switch (kind) {
    case "html":
      return "text-sky-300/80";
    case "css":
      return "text-violet-300/80";
    case "image":
      return "text-emerald-300/80";
    case "script":
      return "text-amber-300/80";
    default:
      return "text-white/55";
  }
}
