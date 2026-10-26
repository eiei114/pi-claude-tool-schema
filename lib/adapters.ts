import { Type } from "typebox";

const path = Type.String({ description: "File path, absolute or relative to the working directory" });
const options = { additionalProperties: false };
export const adapters = [
  { name: "Read", native: "read", description: "Read a file. offset is a 1-based line number; limit is the maximum line count. PDF pages and allow_large are not supported.",
    parameters: Type.Object({ file_path: path, offset: Type.Optional(Type.Integer({ minimum: 1 })), limit: Type.Optional(Type.Integer({ minimum: 1 })) }, options),
    convert: (a: any) => ({ path: a.file_path, ...(a.offset === undefined ? {} : { offset: a.offset }), ...(a.limit === undefined ? {} : { limit: a.limit }) }) },
  { name: "Write", native: "write", description: "Create or overwrite a file.",
    parameters: Type.Object({ file_path: path, content: Type.String() }, options),
    convert: (a: any) => ({ path: a.file_path, content: a.content }) },
  { name: "Edit", native: "edit", description: "Replace one uniquely matching text block using Pi's edit semantics. replace_all=true is not supported.",
    parameters: Type.Object({ file_path: path, old_string: Type.String(), new_string: Type.String(), replace_all: Type.Optional(Type.Boolean()) }, options),
    convert: (a: any) => { if (a.replace_all) throw new Error("replace_all=true is unsupported; use individual exact edits"); return { path: a.file_path, oldText: a.old_string, newText: a.new_string }; } },
  { name: "Bash", native: "bash", description: "Run a foreground shell command using Pi. timeout is milliseconds, rounded up to whole seconds. description is display metadata only. Background execution is unsupported.",
    parameters: Type.Object({ command: Type.String(), timeout: Type.Optional(Type.Integer({ minimum: 1, maximum: 600000 })), description: Type.Optional(Type.String()), run_in_background: Type.Optional(Type.Boolean()) }, options),
    convert: (a: any) => { if (a.run_in_background) throw new Error("Background execution is unsupported"); return { command: a.command, ...(a.timeout === undefined ? {} : { timeout: Math.ceil(a.timeout / 1000) }) }; } },
  { name: "Glob", native: "find", description: "Find paths by glob pattern using Pi's find tool.",
    parameters: Type.Object({ pattern: Type.String(), path: Type.Optional(path) }, options),
    convert: (a: any) => ({ pattern: a.pattern, ...(a.path === undefined ? {} : { path: a.path }) }) },
  { name: "Grep", native: "grep", description: "Search file contents using Pi's grep tool. Only content output is supported; no files_with_matches/count mode. context applies to both sides. head_limit is Pi's match limit.",
    parameters: Type.Object({ pattern: Type.String(), path: Type.Optional(path), glob: Type.Optional(Type.String()), "-i": Type.Optional(Type.Boolean()), context: Type.Optional(Type.Integer({ minimum: 0 })), head_limit: Type.Optional(Type.Integer({ minimum: 1 })), output_mode: Type.Optional(Type.Literal("content")) }, options),
    convert: (a: any) => ({ pattern: a.pattern, ...(a.path === undefined ? {} : { path: a.path }), ...(a.glob === undefined ? {} : { glob: a.glob }), ...(a["-i"] === undefined ? {} : { ignoreCase: a["-i"] }), ...(a.context === undefined ? {} : { context: a.context }), ...(a.head_limit === undefined ? {} : { limit: a.head_limit }) }) },
];

export function selectTools(active: readonly string[], claude: boolean): string[] {
  const aliases = new Set(adapters.map(a => a.name));
  const base = active.filter(name => !aliases.has(name));
  return claude ? [...base, ...adapters.filter(a => base.includes(a.native)).map(a => a.name)] : base;
}
