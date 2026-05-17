interface AICreateFieldsProps {
  name: string;
  slideCount: number;
  width: number;
  height: number;
  category: string;
  onName: (v: string) => void;
  onSlideCount: (v: number) => void;
  onWidth: (v: number) => void;
  onHeight: (v: number) => void;
  onCategory: (v: string) => void;
}

export function AICreateFields({
  name,
  slideCount,
  width,
  height,
  category,
  onName,
  onSlideCount,
  onWidth,
  onHeight,
  onCategory,
}: AICreateFieldsProps) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
          Name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="My Carousel Template"
          className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
            Slides
          </span>
          <input
            type="number"
            min={1}
            max={20}
            value={slideCount}
            onChange={(e) => onSlideCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] tabular-nums text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
            Width
          </span>
          <input
            type="number"
            min={320}
            max={4096}
            value={width}
            onChange={(e) => onWidth(Number(e.target.value) || 1080)}
            className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] tabular-nums text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
            Height
          </span>
          <input
            type="number"
            min={320}
            max={4096}
            value={height}
            onChange={(e) => onHeight(Number(e.target.value) || 1080)}
            className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] tabular-nums text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
          Category
        </span>
        <input
          type="text"
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          placeholder="Marketing / Storytelling / Photography..."
          className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
      </label>
    </>
  );
}
