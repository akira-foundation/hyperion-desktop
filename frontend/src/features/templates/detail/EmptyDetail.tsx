interface EmptyDetailProps {
  picker: React.ReactNode;
}

export function EmptyDetail({ picker }: EmptyDetailProps) {
  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[320px] shrink-0 overflow-y-auto px-4 py-4">{picker}</aside>
      <div className="flex flex-1 items-center justify-center rounded-[20px] bg-black/30 text-[13px] text-white/45 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        Select a template.
      </div>
    </div>
  );
}
