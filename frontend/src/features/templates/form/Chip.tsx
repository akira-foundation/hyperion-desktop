export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-white/55 ring-0.5 ring-white/[0.06]">
      {children}
    </span>
  );
}
