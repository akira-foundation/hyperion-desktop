export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[12.5px] font-semibold tracking-tight text-white">
      {children}
    </h3>
  );
}
