# Security

This package changes the model-facing tool contract, not execution permissions.
Aliases call the already active native Pi tool through `ctx.executeTool()`.
Existing shell/file capabilities retain their normal host access. This package
is not a sandbox or an approval system. It cannot audit other extensions that
mutate tool loadouts after its hooks run.

Unsupported options fail instead of being silently approximated. Report bugs
through GitHub Issues; do not include tokens, prompts, private files, or secrets.
