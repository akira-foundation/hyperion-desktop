import { useState } from "react";
import { AlertCircle, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnyCarouselTemplateMeta } from "@/templates/types";
import { useRenderCarousel } from "@/services/render";
import { CanvasView } from "../CanvasView";
import { PropsEditor } from "../form/PropsEditor";
import { SectionHeading } from "../form/SectionHeading";

interface CarouselDetailProps {
  meta: AnyCarouselTemplateMeta;
  picker: React.ReactNode;
}

export function CarouselDetail({ meta, picker }: CarouselDetailProps) {
  const [shared, setShared] = useState<Record<string, unknown>>(meta.defaultShared);
  const [slides, setSlides] = useState<Record<string, unknown>[]>(meta.defaultSlides);
  const [slideIndex, setSlideIndex] = useState(0);
  const render = useRenderCarousel();

  const idx = Math.max(0, Math.min(slideIndex, slides.length - 1));
  const currentSlide = slides[idx];

  function updateSlide(next: Record<string, unknown>) {
    const copy = [...slides];
    copy[idx] = next;
    setSlides(copy);
  }

  function addSlide() {
    if (slides.length >= meta.maxSlides) return;
    setSlides([...slides, { ...meta.defaultSlides[meta.defaultSlides.length - 1] }]);
    setSlideIndex(slides.length);
  }

  function removeSlide() {
    if (slides.length <= meta.minSlides) return;
    const copy = slides.filter((_, i) => i !== idx);
    setSlides(copy);
    setSlideIndex(Math.max(0, idx - 1));
  }

  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[340px] shrink-0 overflow-y-auto px-4 py-4">
        {picker}

        <section>
          <SectionHeading>Shared</SectionHeading>
          <PropsEditor
            defaults={meta.defaultShared as Record<string, unknown>}
            value={shared}
            onChange={setShared}
          />
        </section>

        <section className="mt-6 border-t border-white/[0.06] pt-5">
          <SectionHeading>
            Slide {idx + 1}
            <span className="ml-1.5 text-[11px] font-normal text-white/40">
              of {slides.length}
            </span>
          </SectionHeading>
          <PropsEditor
            defaults={meta.defaultSlides[0] as Record<string, unknown>}
            value={currentSlide}
            onChange={updateSlide}
          />
        </section>

        <Button
          onClick={() =>
            render.mutate({
              templateId: meta.id,
              payload: { shared, slides },
              size: meta.size,
              slideCount: slides.length,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          }
          disabled={render.isPending}
          className="mt-6 w-full"
        >
          <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
          {render.isPending
            ? `Rendering ${slides.length}...`
            : `Render carousel (${slides.length})`}
        </Button>

        {render.error ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{(render.error as Error).message}</span>
          </div>
        ) : null}
        {render.data && render.data.directory ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
            <Check className="mt-0.5 h-3 w-3 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span>{render.data.files.length} slides saved</span>
              <span className="break-all font-mono text-[10.5px] text-white/55">
                {render.data.directory}
              </span>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden bg-black/30 rounded-[20px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        <div className="flex flex-1 overflow-hidden gap-2">
          <CanvasView
            meta={meta}
            payload={{ shared, slides }}
            slideIndex={idx}
            onSlideChange={setSlideIndex}
          />
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={removeSlide}
              disabled={slides.length <= meta.minSlides}
              className="h-7 rounded-md px-2 text-[11px] font-medium text-white/55 hover:bg-white/[0.06] disabled:opacity-30"
            >
              − Slide
            </button>
            <button
              type="button"
              onClick={addSlide}
              disabled={slides.length >= meta.maxSlides}
              className="h-7 rounded-md px-2 text-[11px] font-medium text-white/65 hover:bg-white/[0.06] disabled:opacity-30"
            >
              + Slide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
