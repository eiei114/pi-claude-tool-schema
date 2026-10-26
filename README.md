# pi-claude-tool-schema

Claude-style tool names and argument schemas for Pi. **Only a schema/argument adapter:**
the existing Pi tools still execute the work. No provider, CLI transport, Python
runtime, prompt replacement, or Codex/Gemini adapter.

An independently written small implementation, not a repackaging of
`pi-familiar-tools`. That project's model-familiar-tool approach inspired this
experiment. Repository scaffold: [pi-extension-template](https://github.com/eiei114/pi-extension-template).

## Install from GitHub

Requires Pi 1.4.0 or newer.

```sh
pi install git:github.com/eiei114/pi-claude-tool-schema
```

Remove other extensions that register `Read`, `Write`, `Edit`, `Bash`, `Glob`, or
`Grep` first (including `pi-familiar-tools`). Duplicate names fail visibly rather
than silently replacing another package. No npm publication is configured.

Select a model whose ID contains `claude`, then restart Pi or `/reload`.
Other model families keep their existing tool loadout. Set
`PI_CLAUDE_TOOL_SCHEMA=off` before starting Pi to disable this package for one process.

## Contract

| Model-facing alias | Pi tool | Translation |
|---|---|---|
| `Read` | `read` | `file_path` → `path`; offset/limit unchanged |
| `Write` | `write` | `file_path` → `path` |
| `Edit` | `edit` | `old_string` / `new_string` → `oldText` / `newText` |
| `Bash` | `bash` | timeout milliseconds → whole seconds, rounded up |
| `Glob` | `find` | pattern/path unchanged |
| `Grep` | `grep` | `-i` → `ignoreCase`; `head_limit` → `limit` |

Only aliases backed by an **already active** Pi tool are activated. Read-only
roles do not gain write, edit, or shell access. Originals stay callable but their
duplicate model-facing declarations are hidden using Pi's public loadout hook.
Switching away from Claude removes aliases, not the original capabilities or
unrelated extension tools.

Execution uses `ctx.executeTool()`: underlying tool implementations, validation,
permission hooks, cancellation, and nested tool events remain in Pi. A `Read`
call consequently emits a nested `read` call. Policy tools may inspect both.

### Deliberately limited compatibility

This is a **supported subset**, not exact current Claude Code parity:

- No PDF `pages` or `allow_large` option.
- `replace_all=true` and background Bash requests fail explicitly.
- Grep supports content mode only. Its context and match limits follow Pi.
- No sandbox override, notebook, subagent, or task-management tools.
- Read output and editing behavior follow Pi, not Claude Code. Pi edit may use
  fuzzy matching; do not treat this as a strict exact-match safety mechanism.
- Tool descriptions are local descriptions, not copied Claude Code prompts.

Official references: [Agent SDK tool inputs](https://code.claude.com/docs/en/agent-sdk/typescript)
and [Claude Code tools](https://code.claude.com/docs/en/tools-reference).

## Performance

No benchmark has established savings for **this implementation**. Prior local
measurements of another extension do not transfer to this package. Names,
descriptions, hidden declarations, cache state, and task strategy all affect cost.

## Development

```sh
npm ci
npm run ci
pi -ne -e . --model anthropic/claude-sonnet-5
```

Tests use Bun; type checking uses TypeScript. Package is `private: true` and has
no npm publish or automatic release workflow. MIT licensed.
