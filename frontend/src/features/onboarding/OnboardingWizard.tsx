import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Check, AlertCircle, ArrowRight, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings, useMarkOnboardingDone } from "@/services/settings";
import { useAIProviders } from "@/services/ai";
import { useImageProviders } from "@/services/images";

export function OnboardingWizard() {
  const settingsQuery = useSettings();
  const aiProvidersQuery = useAIProviders();
  const imageProvidersQuery = useImageProviders();
  const mark = useMarkOnboardingDone();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (settingsQuery.data && !settingsQuery.data.onboardingDone) {
      setOpen(true);
    }
  }, [settingsQuery.data]);

  if (!open) return null;

  const aiProviders = aiProvidersQuery.data ?? [];
  const imageProviders = imageProvidersQuery.data ?? [];
  const anyAIAvailable = aiProviders.some((p) => p.available);
  const anyImageAvailable = imageProviders.some((p) => p.available);

  function finish() {
    mark.mutate(undefined, {
      onSuccess: () => setOpen(false),
    });
  }

  function goToTemplates() {
    finish();
    navigate({ to: "/templates" });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="flex w-[640px] max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-(--color-background) shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-0.5 ring-white/[0.08]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <Hexagon className="h-5 w-5 fill-(--color-primary)/15 text-(--color-primary)" strokeWidth={2} />
          <div>
            <h1 className="text-[16px] font-semibold tracking-tight text-white">Welcome to Hyperion</h1>
            <p className="text-[11.5px] text-white/55">AI-powered content OS. Templates, skills, branded assets — local-first.</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          <Step
            n={1}
            title="AI providers"
            done={anyAIAvailable}
          >
            <ul className="flex flex-col gap-1">
              {aiProviders.map((p) => (
                <li key={p.name} className="flex items-center justify-between rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[11.5px]">
                  <span className="font-medium text-white">{p.displayName}</span>
                  {p.available ? (
                    <span className="flex items-center gap-1 text-emerald-300"><Check className="h-3 w-3" /> Ready</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-300/80" title={p.reason}>
                      <AlertCircle className="h-3 w-3" /> {p.reason?.split(":")[0] ?? "Unavailable"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!anyAIAvailable ? (
              <p className="mt-2 text-[11.5px] text-white/55">
                Install Claude Code CLI (<code className="text-white/75">brew install anthropics/tap/claude</code>) or set <code className="text-white/75">ANTHROPIC_API_KEY</code> / <code className="text-white/75">OPENAI_API_KEY</code> env vars.
              </p>
            ) : null}
          </Step>

          <Step
            n={2}
            title="Image generation"
            done={anyImageAvailable}
          >
            <ul className="flex flex-col gap-1">
              {imageProviders.map((p) => (
                <li key={p.name} className="flex items-center justify-between rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[11.5px]">
                  <span className="font-medium text-white">{p.displayName}</span>
                  {p.available ? (
                    <span className="flex items-center gap-1 text-emerald-300"><Check className="h-3 w-3" /> Ready</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-300/80" title={p.reason}>
                      <AlertCircle className="h-3 w-3" /> {p.reason?.split(":")[0] ?? "Unavailable"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!anyImageAvailable ? (
              <p className="mt-2 text-[11.5px] text-white/55">
                Image gen needs <code className="text-white/75">OPENAI_API_KEY</code>. Optional — skip for now.
              </p>
            ) : null}
          </Step>

          <Step n={3} title="Try it out" done={false}>
            <p className="text-[12px] text-white/65">
              Generate your first template with Claude. Describe the design, attach references, pick dimensions.
            </p>
            <ul className="mt-2 list-disc pl-5 text-[11.5px] text-white/55">
              <li>Studio — AI fills built-in templates</li>
              <li>Templates — create with AI, import folders, edit HTML/CSS</li>
              <li>Skills — bundled workflows (Instagram Carousel etc.)</li>
              <li>Press <kbd className="rounded bg-white/[0.08] px-1 py-0.5 text-[10px]">⌘K</kbd> anytime to search everything</li>
            </ul>
          </Step>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <Button variant="outline" onClick={finish}>
            Skip for now
          </Button>
          <Button onClick={goToTemplates}>
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            Open Templates
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold ${
            done ? "bg-(--color-primary) text-(--color-primary-foreground)" : "bg-white/[0.08] text-white/75"
          }`}
        >
          {done ? <Check className="h-3 w-3" /> : n}
        </span>
        <h2 className="text-[13px] font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
