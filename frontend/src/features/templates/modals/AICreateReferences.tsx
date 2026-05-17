import { X } from "lucide-react";
import { pickReferenceFiles } from "@/services/templates";
import { readAsBase64 } from "../lib/files";

export interface Attachment {
  filename: string;
  base64: string;
  preview: string;
}

interface AICreateReferencesProps {
  attachments: Attachment[];
  localRefs: string[];
  urls: string[];
  urlInput: string;
  onAttachmentsChange: (next: Attachment[]) => void;
  onLocalRefsChange: (next: string[]) => void;
  onUrlsChange: (next: string[]) => void;
  onUrlInputChange: (v: string) => void;
}

export function AICreateReferences({
  attachments,
  localRefs,
  urls,
  urlInput,
  onAttachmentsChange,
  onLocalRefsChange,
  onUrlsChange,
  onUrlInputChange,
}: AICreateReferencesProps) {
  async function onAttach(files: FileList | null) {
    if (!files) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files)) {
      const b64 = await readAsBase64(f);
      next.push({
        filename: f.name,
        base64: b64,
        preview: f.type.startsWith("image/") ? `data:${f.type};base64,${b64}` : "",
      });
    }
    onAttachmentsChange([...attachments, ...next]);
  }

  async function onPickLocal() {
    try {
      const paths = await pickReferenceFiles();
      if (paths && paths.length > 0) {
        onLocalRefsChange([...localRefs, ...paths]);
      }
    } catch (e) {
      console.error("[hyperion] pick refs:", e);
    }
  }

  function addURL() {
    const u = urlInput.trim();
    if (!u) return;
    onUrlsChange([...urls, u]);
    onUrlInputChange("");
  }

  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
        References (optional)
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {attachments.map((a, i) => (
          <div
            key={i}
            className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-white/[0.05] ring-0.5 ring-white/[0.08]"
            title={a.filename}
          >
            {a.preview ? (
              <img src={a.preview} alt={a.filename} className="h-full w-full object-cover" />
            ) : (
              <span className="px-1 text-center text-[10px] text-white/55">
                {a.filename.split(".").pop()?.toUpperCase()}
              </span>
            )}
            <button
              type="button"
              onClick={() => onAttachmentsChange(attachments.filter((_, idx) => idx !== i))}
              className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-black/70 text-white/85 hover:bg-red-500/80"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-white/15 text-[10.5px] text-white/55 hover:border-white/30 hover:text-white/85">
          + Upload
          <input
            type="file"
            multiple
            accept="image/*,application/pdf,.md,.txt,.html,.css"
            onChange={(e) => onAttach(e.target.files)}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={onPickLocal}
          className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-white/15 text-[10.5px] text-white/55 hover:border-white/30 hover:text-white/85"
        >
          + Local
        </button>
      </div>

      {localRefs.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {localRefs.map((p, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1 text-[11.5px] ring-0.5 ring-white/[0.06]"
            >
              <span className="flex-1 truncate font-mono text-white/75">{p}</span>
              <button
                type="button"
                onClick={() => onLocalRefsChange(localRefs.filter((_, idx) => idx !== i))}
                className="flex h-5 w-5 items-center justify-center rounded text-white/55 hover:bg-red-500/15 hover:text-red-300"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => onUrlInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addURL();
            }
          }}
          placeholder="https://example.com — Add URL"
          className="h-8 flex-1 rounded-md bg-white/[0.05] px-2.5 text-[12px] text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
        />
        <button
          type="button"
          onClick={addURL}
          disabled={!urlInput.trim()}
          className="h-8 rounded-md bg-white/[0.08] px-3 text-[12px] text-white/85 hover:bg-white/[0.12] disabled:opacity-30"
        >
          Add
        </button>
      </div>

      {urls.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {urls.map((u, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1 text-[11.5px] ring-0.5 ring-white/[0.06]"
            >
              <span className="flex-1 truncate text-white/75">{u}</span>
              <button
                type="button"
                onClick={() => onUrlsChange(urls.filter((_, idx) => idx !== i))}
                className="flex h-5 w-5 items-center justify-center rounded text-white/55 hover:bg-red-500/15 hover:text-red-300"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <span className="mt-1 block text-[10.5px] text-white/40">
        Upload files, pick local paths, or paste URLs. Claude reads everything to ground the design.
      </span>
    </div>
  );
}
