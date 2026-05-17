import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Image, Calendar, Plus, LayoutTemplate } from "lucide-react";

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-white/55">
            Generate, render, and ship branded content.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline">
            <LayoutTemplate className="h-4 w-4" strokeWidth={2} />
            Browse templates
          </Button>
          <Button>
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            New draft
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Sparkles, title: "Generate", desc: "AI-assisted drafts" },
          { icon: Image, title: "Render", desc: "Branded assets" },
          { icon: Calendar, title: "Schedule", desc: "Plan publication" },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl bg-white/[0.04] p-4 ring-0.5 ring-white/[0.06] transition hover:bg-white/[0.06]"
          >
            <Icon className="h-5 w-5 text-(--color-primary)" strokeWidth={2} />
            <div className="mt-3 text-[13px] font-semibold text-white">{title}</div>
            <div className="text-[12px] text-white/50">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({ component: HomePage });
