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
cps select
cps set anthropic
```

## Commands

- `cps list`: list all providers (show id + name)
- `cps current`: show current provider
- `cps select`: interactively select and apply a provider
- `cps set <id>`: switch provider by id and apply to Claude settings
- `cps add <name>`: add a provider
- `cps remove <name>`: remove a provider
- `cps serve`: start local UI + API server
