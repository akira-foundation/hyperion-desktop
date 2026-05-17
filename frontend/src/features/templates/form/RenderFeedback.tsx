import { AlertCircle, Check } from "lucide-react";

interface RenderFeedbackProps {
  error: Error | null;
  result: { path: string; sizeBytes: number } | null;
}

export function RenderFeedback({ error, result }: RenderFeedbackProps) {
  if (error) {
    return (
      <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{error.message}</span>
      </div>
    );
  }
  if (result) {
    return (
      <div className="mt-2 flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
        <Check className="mt-0.5 h-3 w-3 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span>Saved {(result.sizeBytes / 1024).toFixed(0)} KB</span>
          <span className="break-all font-mono text-[10.5px] text-white/55">{result.path}</span>
        </div>
      </div>
    );
  }
  return null;
}
