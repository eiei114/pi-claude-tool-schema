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
  f.events.get("session_start")({}, { model: { id: "claude-sonnet-5" } });
  expect(f.tools.get("Read").prepareLoadout({ declared: [{ name: "read" }] })).toEqual({ hiddenDeclarations: ["read"] });
  expect(f.pi.getActiveTools()).toContain("read");
});

test("execution forwards to native runtime and preserves denial", async () => {
  const f = fixture();
  f.events.get("session_start")({}, { model: { provider: "claude-cli", id: "opus" } });
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
  f.events.get("session_start")({}, { model: { id: "claude-sonnet-5" } });
  await expect(f.tools.get("Bash").execute("outer", { command: "pwd" }, undefined, undefined, {
    executeTool() { throw new Error("must never execute"); },
  })).rejects.toThrow("inactive");
});

test("aliases are hidden and execution is blocked on non-Claude, including model switches", async () => {
  const f = fixture();
  expect(f.tools.get("Read").exposure).toBe("hidden");
  f.events.get("session_start")({}, { model: { provider: "claude-cli", id: "opus" } });
  expect(f.tools.get("Read").exposure).toBe("codemode");
  f.events.get("model_select")({ model: { provider: "openai-codex", id: "gpt-5.6-luna" } });
  expect(f.tools.get("Read").exposure).toBe("hidden");
  expect(f.pi.getActiveTools()).toEqual(["read", "write", "custom", "apply_patch"]);
  expect(f.tools.get("Read").prepareLoadout({ declared: [{ name: "read" }] })).toEqual({ hiddenDeclarations: [] });
  await expect(f.tools.get("Read").execute("outer", { file_path: "x" }, undefined, undefined, {})).rejects.toThrow("inactive for this model");
});
