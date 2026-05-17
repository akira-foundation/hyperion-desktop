import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

export function SidebarItem({ to, label, icon: Icon, count }: SidebarItemProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "no-drag group flex h-7 items-center gap-2.5 rounded-[7px] px-2 text-[13px] leading-none transition-colors",
        "text-white/75 hover:bg-white/[0.05]",
        isActive && "bg-white/[0.07] text-white",
      )}
    >
      <Icon className="h-[15px] w-[15px] shrink-0 text-white/55" strokeWidth={1.75} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined ? (
        <span className="text-[12px] tabular-nums text-white/40">{count}</span>
      ) : null}
    </Link>
  );
}
