# Claude Provider Switcher

A TypeScript CLI + local web UI for switching Claude Code providers by updating `~/.claude/settings.json` env keys.

## Features
- CLI commands: `list`, `current`, `set`, `add`, `remove`, `serve`
- Local web UI built with React + Tailwind + shadcn-style components
- Config persisted in `~/.config/claude-provider-switcher/config.json`
- Applies `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`
- Automatic settings backup (latest 3)
- Applying a provider requires `authToken` to be set

## Quick Start
```bash
pnpm install
pnpm run build
pnpm dlx claude-provider serve
```

### CLI Examples
```bash
pnpm dlx claude-provider list
pnpm dlx claude-provider add custom --base-url https://api.example.com --token sk-xxx --model claude-3-5-sonnet --website https://example.com --description "Custom provider"
pnpm dlx claude-provider set custom
pnpm dlx claude-provider current
```

### Development
```bash
pnpm run dev
# UI dev server on http://localhost:5173
# API server on http://localhost:8787
# Any file change under packages/ will restart both servers.
```

## Settings Mapping
This tool writes to `~/.claude/settings.json` and updates:
- `env.ANTHROPIC_BASE_URL`
- `env.ANTHROPIC_AUTH_TOKEN`
- `env.ANTHROPIC_MODEL` (removed if empty)

## Testing
```bash
pnpm run test
```
