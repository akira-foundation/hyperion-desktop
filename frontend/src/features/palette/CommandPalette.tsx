import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  Wand2,
  LayoutTemplate,
  PenLine,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Sparkles,
  Search,
} from "lucide-react";
import { listTemplates } from "@/templates/registry";
import { useUserTemplates } from "@/services/templates";
import { useSkills } from "@/services/skills";
import { useAssets } from "@/services/images";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  action: () => void;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const userTemplatesQuery = useUserTemplates();
  const skillsQuery = useSkills();
  const assetsQuery = useAssets();

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];

    out.push(
      { id: "nav-home", title: "Home", icon: Home, group: "Navigate", action: () => navigate({ to: "/" }) },
      { id: "nav-studio", title: "Studio", icon: Wand2, group: "Navigate", action: () => navigate({ to: "/studio" }) },
      { id: "nav-skills", title: "Skills", icon: Sparkles, group: "Navigate", action: () => navigate({ to: "/skills" }) },
      { id: "nav-templates", title: "Templates", icon: LayoutTemplate, group: "Navigate", action: () => navigate({ to: "/templates" }) },
      { id: "nav-drafts", title: "Drafts", icon: PenLine, group: "Navigate", action: () => navigate({ to: "/drafts" }) },
      { id: "nav-assets", title: "Assets", icon: ImageIcon, group: "Navigate", action: () => navigate({ to: "/assets" }) },
      { id: "nav-settings", title: "Settings", icon: SettingsIcon, group: "Navigate", action: () => navigate({ to: "/settings" }) },
    );

    for (const t of listTemplates()) {
      out.push({
        id: `tpl-${t.id}`,
        title: t.name,
        subtitle: `${t.category} · ${t.size.width}×${t.size.height}`,
        icon: LayoutTemplate,
        group: "Templates",
        action: () => navigate({ to: "/studio" }),
      });
    }

    for (const t of userTemplatesQuery.data ?? []) {
      out.push({
        id: `user-tpl-${t.id}`,
        title: t.name,
        subtitle: `User template · ${t.slides.length} slide${t.slides.length === 1 ? "" : "s"}`,
        icon: LayoutTemplate,
        group: "Your templates",
        action: () =>
          navigate({ to: "/templates", search: { selected: t.id } as Record<string, string> }),
      });
    }

    for (const s of skillsQuery.data ?? []) {
      out.push({
        id: `skill-${s.id}`,
        title: s.name,
        subtitle: s.description,
        icon: Sparkles,
        group: "Skills",
        action: () => navigate({ to: "/skills" }),
      });
    }

    for (const a of (assetsQuery.data ?? []).slice(0, 30)) {
      out.push({
        id: `asset-${a.id}`,
        title: a.prompt.slice(0, 60),
        subtitle: `${a.kind} · ${a.size}`,
        icon: ImageIcon,
        group: "Assets",
        action: () => navigate({ to: "/assets" }),
      });
    }

    return out;
  }, [navigate, userTemplatesQuery.data, skillsQuery.data, assetsQuery.data]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle?.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIdx];
      if (item) {
        item.action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  // group items
  const groups = new Map<string, Item[]>();
  for (const it of filtered) {
    const arr = groups.get(it.group) ?? [];
    arr.push(it);
    groups.set(it.group, arr);
  }
  const flatIndexed: { item: Item; idx: number }[] = [];
  let idx = 0;
  for (const [, arr] of groups) {
    for (const it of arr) {
      flatIndexed.push({ item: it, idx });
      idx++;
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-[12vh] flex w-[640px] max-h-[70vh] flex-col overflow-hidden rounded-xl bg-(--color-background) shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-0.5 ring-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
          <Search className="h-4 w-4 text-white/45" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search templates, skills, assets, pages..."
            className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
          />
          <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">esc</kbd>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {Array.from(groups.entries()).map(([group, arr]) => (
            <div key={group} className="px-1 pb-1">
              <div className="px-2.5 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-white/40">
                {group}
              </div>
              <ul className="flex flex-col gap-px">
                {arr.map((it) => {
                  const flat = flatIndexed.find((f) => f.item.id === it.id);
                  const active = flat?.idx === activeIdx;
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => {
                          it.action();
                          onClose();
                        }}
                        onMouseEnter={() => flat && setActiveIdx(flat.idx)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors",
                          active ? "bg-white/[0.08] text-white" : "text-white/75 hover:bg-white/[0.04]",
                        )}
                      >
                        <it.icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-(--color-primary)" : "text-white/45")} />
                        <span className="flex-1 truncate text-[13px]">{it.title}</span>
                        {it.subtitle ? (
                          <span className="ml-2 truncate text-[11px] text-white/45">{it.subtitle}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-white/40">No matches.</div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-white/[0.06] px-3 py-2 text-[10.5px] text-white/40">
          <span className="flex items-center gap-1"><kbd className="rounded bg-white/[0.06] px-1 py-px">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded bg-white/[0.06] px-1 py-px">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="rounded bg-white/[0.06] px-1 py-px">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
