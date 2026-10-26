import { expect, test } from "bun:test";
import { isClaudeModel } from "../lib/model-scope.ts";

test("Anthropic and Claude CLI providers support renamed model IDs", () => {
  expect(isClaudeModel({ provider: "anthropic", id: "opus" })).toBe(true);
  expect(isClaudeModel({ provider: "claude-cli", id: "sonnet" })).toBe(true);
  expect(isClaudeModel({ provider: "claude-bridge", id: "opus" })).toBe(true);
});
test("recognize Claude IDs independently of provider", () => {
  for (const id of ["claude-opus-5-5", "anthropic/claude-sonnet-5", "us.anthropic.claude-sonnet-5", "Claude-Haiku-5-5"])
    expect(isClaudeModel({ provider: "custom-router", id })).toBe(true);
});
test("Codex, Gemini, and compatible third-party models are not Claude", () => {
  for (const model of [undefined, {}, { provider: "openai-codex", id: "gpt-5.6-luna" },
    { provider: "google", id: "gemini-3-pro" }, { provider: "custom", id: "deepseek", api: "anthropic-messages" },
    { provider: "custom", id: "not-claude" }]) expect(isClaudeModel(model)).toBe(false);
});
