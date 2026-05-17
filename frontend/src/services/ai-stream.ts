import { useEffect, useRef, useState } from "react";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";
import { GenerateContentStream } from "../../wailsjs/go/main/App";
import type { application } from "../../wailsjs/go/models";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

interface ChunkPayload {
  requestId: string;
  delta: string;
}
interface DonePayload {
  requestId: string;
}
interface ErrorPayload {
  requestId: string;
  message: string;
}

export function useAIStream() {
  const [status, setStatus] = useState<Status>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const onChunk = (p: ChunkPayload) => {
      if (p.requestId !== requestIdRef.current) return;
      setStatus("streaming");
      setText((prev) => prev + p.delta);
    };
    const onDone = (p: DonePayload) => {
      if (p.requestId !== requestIdRef.current) return;
      setStatus("done");
    };
    const onError = (p: ErrorPayload) => {
      if (p.requestId !== requestIdRef.current) return;
      setStatus("error");
      setError(p.message);
    };

    EventsOn("ai:chunk", onChunk);
    EventsOn("ai:done", onDone);
    EventsOn("ai:error", onError);

    return () => {
      EventsOff("ai:chunk");
      EventsOff("ai:done");
      EventsOff("ai:error");
    };
  }, []);

  async function start(req: application.GenerateRequest) {
    setStatus("loading");
    setText("");
    setError(null);
    try {
      const id = await GenerateContentStream(req);
      requestIdRef.current = id;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function reset() {
    requestIdRef.current = null;
    setStatus("idle");
    setText("");
    setError(null);
  }

  return { status, text, error, start, reset };
}
