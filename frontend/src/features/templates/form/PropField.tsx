interface PropFieldProps {
  name: string;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function PropField({ name, value, onChange }: PropFieldProps) {
  const label = (
    <span className="mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/40">
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
