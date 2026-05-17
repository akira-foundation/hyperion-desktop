import { Check, Pencil } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { templatesByCategory } from "@/templates/registry";
import type { template } from "../../../../wailsjs/go/models";

interface BrowserListProps {
  groups: ReturnType<typeof templatesByCategory>;
  userTemplates: template.RuntimeTemplate[];
  currentValue: string;
  previewKey: string;
  onPreview: (key: string) => void;
  onUse: (key: string) => void;
  onEdit?: (key: string) => void;
}

export function BrowserList({
  groups,
  userTemplates,
  currentValue,
  previewKey,
  onPreview,
  onUse,
  onEdit,
}: BrowserListProps) {
  return (
    <Command
      value={previewKey}
      onValueChange={onPreview}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <CommandInput placeholder="Search templates..." />
      <CommandList className="!max-h-none flex-1">
        <CommandEmpty>No template matches.</CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g.category} heading={g.category}>
            {g.items.map((t) => {
              const v = `builtin:${t.id}`;
              return (
                <Row
                  key={t.id}
                  value={v}
                  name={t.name}
                  subtitle={`${t.aspectRatio} · ${t.size.width}×${t.size.height}`}
                  keywords={[t.name, t.aspectRatio, g.category]}
                  selected={currentValue === v}
                  onPreview={onPreview}
                  onUse={onUse}
                  onEdit={onEdit}
                />
              );
            })}
          </CommandGroup>
        ))}
        {userTemplates.length > 0 ? (
          <CommandGroup heading="Your templates">
            {userTemplates.map((t) => {
              const v = `user:${t.id}`;
              return (
                <Row
                  key={t.id}
                  value={v}
                  name={t.name}
                  subtitle={`${t.slides.length} slides · ${t.size.width}×${t.size.height}`}
                  keywords={[t.name, t.category]}
                  selected={currentValue === v}
                  onPreview={onPreview}
                  onUse={onUse}
                  onEdit={onEdit}
                />
              );
            })}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}

interface RowProps {
  value: string;
  name: string;
  subtitle: string;
  keywords: string[];
  selected: boolean;
  onPreview: (key: string) => void;
  onUse: (key: string) => void;
  onEdit?: (key: string) => void;
}

function Row({ value, name, subtitle, keywords, selected, onUse, onEdit }: RowProps) {
  return (
    <CommandItem
      value={value}
      keywords={keywords}
      className="group/row !rounded-[10px] !py-2 !pl-2.5 !pr-1.5 data-[selected=true]:bg-white/[0.06]"
    >
      <div className="flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[12.5px] font-medium text-white">{name}</span>
          <span className="truncate text-[10.5px] text-white/45">{subtitle}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 group-data-[selected=true]/row:opacity-100">
          {onEdit ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(value);
              }}
              title="Modify with Claude"
              aria-label="Modify with Claude"
              className="flex h-6 w-6 items-center justify-center rounded text-white/55 hover:bg-white/[0.08] hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUse(value);
            }}
            className="ml-0.5 h-6 rounded-md bg-(--color-primary) px-2 text-[10.5px] font-semibold text-(--color-primary-foreground) shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.15)] hover:brightness-110"
          >
            Use
          </button>
        </div>
        {selected ? (
          <Check
            className="h-3.5 w-3.5 shrink-0 text-(--color-primary) group-hover/row:hidden group-data-[selected=true]/row:hidden"
            strokeWidth={2.5}
          />
        ) : null}
      </div>
    </CommandItem>
  );
}
