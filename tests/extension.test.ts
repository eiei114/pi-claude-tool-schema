import { expect, test } from "bun:test";
import setup from "../extensions/index.ts";

function fixture() {
  let active = ["read", "write", "custom", "apply_patch"];
  const tools = new Map<string, any>();
  const events = new Map<string, any>();
  const pi = { registerTool(t: any) { tools.set(t.name, t); }, on(name: string, fn: any) { events.set(name, fn); },
    getActiveTools() { return active; }, setActiveTools(names: string[]) { active = names; } };
  setup(pi as any);
  return { pi, tools, events };
}

test("only Claude activates backed aliases and model switching restores the host set", () => {
  const f = fixture();
  f.events.get("session_start")({}, { model: { id: "claude-sonnet-5" } });
  expect(f.pi.getActiveTools()).toEqual(["read", "write", "custom", "apply_patch", "Read", "Write"]);
  f.events.get("model_select")({ model: { id: "gpt-6" } });
  expect(f.pi.getActiveTools()).toEqual(["read", "write", "custom", "apply_patch"]);
});

test("hide declarations without disabling original capability", () => {
  const f = fixture();
  expect(f.tools.get("Read").prepareLoadout({ declared: [{ name: "read" }] })).toEqual({ hiddenDeclarations: ["read"] });
  expect(f.pi.getActiveTools()).toContain("read");
});

test("execution forwards to native runtime and preserves denial", async () => {
  const f = fixture();
  let observed: any;
  const controller = new AbortController();
  const result = await f.tools.get("Read").execute("outer", { file_path: "a.txt" }, controller.signal, undefined, {
    async executeTool(name: string, args: any, options: any) {
      observed = { name, args, signal: options.signal };
      return { result: { content: [{ type: "text", text: "denied" }], details: {} }, isError: true };
    },
  });
  expect(observed).toEqual({ name: "read", args: { path: "a.txt" }, signal: controller.signal });
  expect(result.isError).toBe(true);
});

test("inactive native capabilities are rejected even if an alias is manually activated", async () => {
  const f = fixture();
  await expect(f.tools.get("Bash").execute("outer", { command: "pwd" }, undefined, undefined, {
    executeTool() { throw new Error("must never execute"); },
  })).rejects.toThrow("inactive");
});
