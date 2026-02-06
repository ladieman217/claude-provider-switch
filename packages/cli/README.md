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
cps set anthropic
```

## Commands

- `cps list`: list all providers
- `cps current`: show current provider
- `cps set <name>`: switch provider and apply to Claude settings
- `cps add <name>`: add a provider
- `cps remove <name>`: remove a provider
- `cps serve`: start local UI + API server
