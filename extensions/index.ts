import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { adapters, selectTools } from "../lib/adapters.ts";
import { isClaudeModel, type ModelIdentity } from "../lib/model-scope.ts";

export default function (pi: ExtensionAPI) {
  if (process.env.PI_CLAUDE_TOOL_SCHEMA === "off") return;
  let enabled = false;
  function register(exposure: "codemode" | "hidden") {
    for (const adapter of adapters) pi.registerTool({
      name: adapter.name, label: adapter.name, description: adapter.description,
      parameters: adapter.parameters, exposure,
      reachesTools: () => [adapter.native],
      prepareLoadout(loadout) {
        // Keep the original tool callable, but don't send duplicate schemas to the model.
        return { hiddenDeclarations: enabled && loadout.declared.some(t => t.name === adapter.native) ? [adapter.native] : [] };
      },
      async execute(_id, args, signal, onUpdate, ctx) {
        if (!enabled) throw new Error("Claude tool schema adapter is inactive for this model");
        if (!pi.getActiveTools().includes(adapter.native)) throw new Error(`Required capability is inactive: ${adapter.native}`);
        const outcome = await ctx.executeTool(adapter.native, adapter.convert(args), { signal, onUpdate });
        return { ...outcome.result, isError: outcome.isError };
      },
    });
  }
  register("hidden");
  const sync = (model: ModelIdentity | undefined) => {
    const active = pi.getActiveTools();
    enabled = isClaudeModel(model);
    // Hidden tools cannot be discovered or invoked through JS codemode either.
    register(enabled ? "codemode" : "hidden");
    pi.setActiveTools(selectTools(active, enabled));
  };
  pi.on("session_start", (_event, ctx) => sync(ctx.model));
  pi.on("model_select", (event) => sync(event.model));
}
