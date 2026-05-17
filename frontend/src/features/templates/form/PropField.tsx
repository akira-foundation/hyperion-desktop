import { Switch } from "@/components/ui/switch";

interface PropFieldProps {
  name: string;
  value: unknown;
  onChange: (v: unknown) => void;
}

const BINARY_ENUMS: Record<string, [string, string]> = {
  background: ["light", "dark"],
  theme: ["light", "dark"],
  mode: ["light", "dark"],
};

export function PropField({ name, value, onChange }: PropFieldProps) {
  const label = (
    <span className="mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/40">
      {name}
    </span>
  );

  const binaryPair = BINARY_ENUMS[name.toLowerCase()];
  if (
    binaryPair &&
    typeof value === "string" &&
    (value === binaryPair[0] || value === binaryPair[1])
  ) {
    const checked = value === binaryPair[1];
    return (
      <label className="flex items-center justify-between gap-3">
        <span className="block text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/40">
          {name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-white/65">{value}</span>
          <Switch
            checked={checked}
            onCheckedChange={(next) => onChange(next ? binaryPair[1] : binaryPair[0])}
            ariaLabel={name}
          />
        </div>
      </label>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center justify-between gap-3">
        <span className="block text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/40">
          {name}
        </span>
        <Switch checked={value} onCheckedChange={onChange} ariaLabel={name} />
      </label>
    );
  }

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
