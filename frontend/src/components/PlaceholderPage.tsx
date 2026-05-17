interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-1 text-sm text-white/55">{description ?? "Coming soon."}</p>
      <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm text-white/40">
        Empty state
      </div>
    </div>
  );
}
