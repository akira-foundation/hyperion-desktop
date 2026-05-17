import { PropField } from "./PropField";

interface PropsEditorProps {
  defaults: Record<string, unknown>;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function PropsEditor({ defaults, value, onChange }: PropsEditorProps) {
  return (
    <div className="flex flex-col gap-3.5">
      {Object.entries(defaults).map(([key, defaultVal]) => (
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
