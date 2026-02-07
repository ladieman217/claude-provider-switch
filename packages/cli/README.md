# claude-provider-switch

A CLI and local web UI to switch Claude Code providers by updating `~/.claude/settings.json`.

## Install

```bash
npm install -g claude-provider-switch
```

## Usage

```bash
cps serve
```

Open `http://localhost:8787` and manage providers from the UI, or use CLI commands:

```bash
cps list
cps current
cps version
cps select
cps use anthropic
```

## Commands

- `cps list`: list all providers (show id + name)
- `cps current`: show current provider
- `cps version`: show CLI version
- `cps select`: interactively select and apply a provider
- `cps use <id>`: switch provider by id and apply to Claude settings
- `cps add <name>`: add a provider (optional `--id` for stable id)
- `cps remove <name>`: remove a provider
- `cps serve`: start local UI + API server

`--id` format: lowercase letters, numbers, and hyphens only, max length 24, unique.
