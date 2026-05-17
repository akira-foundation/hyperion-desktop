export type Selection =
  | { kind: "builtin"; id: string }
  | { kind: "user"; id: string };
