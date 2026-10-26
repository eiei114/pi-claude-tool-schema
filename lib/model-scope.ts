export interface ModelIdentity { id?: string; provider?: string; api?: string }

/** Recognize a model family, not merely an Anthropic-compatible transport. */
export function isClaudeModel(model: ModelIdentity | undefined): boolean {
  if (!model) return false;
  const provider = (model.provider ?? "").toLowerCase();
  if (provider === "anthropic" || /^claude(?:[-_/]|$)/.test(provider)) return true;
  // Includes ordinary IDs, OpenRouter anthropic/claude-*, and Bedrock *.claude-*.
  return /(?:^|[./:])claude(?:[-_]|$)/i.test(model.id ?? "");
}
