import { Check } from "lucide-react";
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
}

export function BrowserList({
  groups,
  userTemplates,
  currentValue,
  previewKey,
  onPreview,
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
                <CommandItem
                  key={t.id}
                  value={v}
                  keywords={[t.name, t.aspectRatio, g.category]}
                  onSelect={() => onPreview(v)}
                  className="!rounded-[10px] !py-2 !pl-2.5 !pr-2.5 data-[selected=true]:bg-white/[0.06]"
                >
                  <BrowserItem
                    title={t.name}
                    subtitle={`${t.aspectRatio} · ${t.size.width}×${t.size.height}`}
                    selected={currentValue === v}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        {userTemplates.length > 0 ? (
          <CommandGroup heading="Your templates">
            {userTemplates.map((t) => {
              const v = `user:${t.id}`;
              return (
                <CommandItem
                  key={t.id}
                  value={v}
                  keywords={[t.name, t.category]}
                  onSelect={() => onPreview(v)}
                  className="!rounded-[10px] !py-2 !pl-2.5 !pr-2.5 data-[selected=true]:bg-white/[0.06]"
                >
                  <BrowserItem
                    title={t.name}
                    subtitle={`${t.slides.length} slides · ${t.size.width}×${t.size.height}`}
                    selected={currentValue === v}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}

function BrowserItem({
  title,
  subtitle,
  selected,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
}) {
  return (
    <>
      <div className="flex w-full flex-col gap-0.5">
        <span className="truncate text-[12.5px] font-medium text-white">{title}</span>
        <span className="truncate text-[10.5px] text-white/45">{subtitle}</span>
      </div>
      {selected ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-(--color-primary)" strokeWidth={2.5} />
      ) : null}
    </>
  );
}
