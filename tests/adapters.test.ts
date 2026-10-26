import { expect, test } from "bun:test";
import { adapters, selectTools } from "../lib/adapters.ts";
const convert = (name: string, args: object): Record<string, unknown> => adapters.find(a => a.name === name)!.convert(args);
test("Claude mapping never grants an inactive capability", () => {
  expect(selectTools(["read", "custom"], true)).toEqual(["read", "custom", "Read"]);
  expect(selectTools([], true)).toEqual([]);
});
test("switch away removes only this extension's aliases", () => {
  expect(selectTools(["read", "Read", "apply_patch", "codemode"], false)).toEqual(["read", "apply_patch", "codemode"]);
  expect(selectTools(["read", "Read"], true)).toEqual(["read", "Read"]);
});
test("read/write/edit translate arguments only", () => {
  expect(convert("Read", { file_path: "x", offset: 2, limit: 3 })).toEqual({ path: "x", offset: 2, limit: 3 });
  expect(convert("Write", { file_path: "x", content: "y" })).toEqual({ path: "x", content: "y" });
  expect(convert("Edit", { file_path: "x", old_string: "a", new_string: "b" })).toEqual({ path: "x", oldText: "a", newText: "b" });
});
test("unsupported semantics fail instead of silently changing meaning", () => {
  expect(() => convert("Edit", { replace_all: true })).toThrow("unsupported");
  expect(() => convert("Bash", { run_in_background: true })).toThrow("unsupported");
});
test("milliseconds convert to seconds without shortening deadline", () => {
  expect(convert("Bash", { command: "pwd", timeout: 1501 })).toEqual({ command: "pwd", timeout: 2 });
});
test("search mapping", () => {
  expect(convert("Grep", { pattern: "x", "-i": true, context: 2, head_limit: 5 })).toEqual({ pattern: "x", ignoreCase: true, context: 2, limit: 5 });
  expect(convert("Glob", { pattern: "*.ts" })).toEqual({ pattern: "*.ts" });
});
