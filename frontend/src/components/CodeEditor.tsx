import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

interface Props {
  value: string;
  onChange: (next: string) => void;
  filename?: string;
  className?: string;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  filename = "",
  className,
  readOnly = false,
  height,
}: Props) {
  const ext = useMemo(() => {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".css")) return [css()];
    if (lower.endsWith(".html") || lower.endsWith(".htm")) return [html({ matchClosingTags: true, autoCloseTags: true })];
    return [];
  }, [filename]);

  return (
    <CodeMirror
      value={value}
      onChange={(v) => onChange(v)}
      extensions={[
        ...ext,
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { fontSize: "12.5px", height: height ?? "100%" },
          ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
          ".cm-gutters": { background: "transparent", borderRight: "1px solid rgba(255,255,255,0.05)" },
          "&.cm-focused": { outline: "none" },
        }),
      ]}
      theme={oneDark}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        bracketMatching: true,
        autocompletion: true,
        foldGutter: true,
        indentOnInput: true,
        closeBrackets: true,
        tabSize: 2,
      }}
      className={className}
      style={{ height: height ?? "100%" }}
    />
  );
}
