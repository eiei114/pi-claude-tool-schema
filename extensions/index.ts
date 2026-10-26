import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { adapters, selectTools } from "../lib/adapters.ts";

export default function (pi: ExtensionAPI) {
  if (process.env.PI_CLAUDE_TOOL_SCHEMA === "off") return;
  for (const adapter of adapters) {
    pi.registerTool({
      name: adapter.name, label: adapter.name, description: adapter.description,
      parameters: adapter.parameters, exposure: "codemode",
      reachesTools: () => [adapter.native],
      prepareLoadout(loadout) {
        // Keep the original tool callable, but don't send duplicate schemas to the model.
        return { hiddenDeclarations: loadout.declared.some(t => t.name === adapter.native) ? [adapter.native] : [] };
      },
      async execute(_id, args, signal, onUpdate, ctx) {
        if (!pi.getActiveTools().includes(adapter.native)) throw new Error(`Required capability is inactive: ${adapter.native}`);
        const outcome = await ctx.executeTool(adapter.native, adapter.convert(args), { signal, onUpdate });
        return { ...outcome.result, isError: outcome.isError };
      },
    });
  }
  const sync = (model: { id?: string } | undefined) => pi.setActiveTools(selectTools(pi.getActiveTools(), /claude/i.test(model?.id ?? "")));
  pi.on("session_start", (_event, ctx) => sync(ctx.model));
  pi.on("model_select", (event) => sync(event.model));
}
