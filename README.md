# Claude Provider Switcher

[![npm version](https://img.shields.io/npm/v/claude-provider-switch)](https://www.npmjs.com/package/claude-provider-switch)
[![license](https://img.shields.io/npm/l/claude-provider-switch)](LICENSE)
![node version](https://img.shields.io/node/v/claude-provider-switch)

[English](README.md) | [中文](README.zh-CN.md)

Quickly switch between Claude Code API providers. Supports official Anthropic API and any third-party service compatible with Anthropic's API format (such as Zhipu, Volcengine Ark, etc.).

<p align="center">
  <img src="docs/screenshot-ui.png" alt="Web UI Screenshot" width="720">
</p>

## Why This Tool?

- **Multi-provider Management** — Configure multiple API providers and switch instantly
- **No Manual Config Editing** — Automatically manages `~/.claude/settings.json`
- **Safe Backups** — Automatic backups before every change, easy to restore
- **Visual Interface** — Both CLI and intuitive Web UI included

## Installation

### Global Install (Recommended)

```bash
npm install -g claude-provider-switch
# or use pnpm
pnpm add -g claude-provider-switch
```

### Using npx (No Installation)

```bash
npx claude-provider-switch serve
```

### Requirements

- **Node.js >= 18**

## Quick Start

### 1. Launch Web UI (Recommended)

```bash
cps serve
```

Then open http://localhost:8787 to manage providers through the interface.

### 2. Use CLI

```bash
# Check current configuration
cps current

# Show version
cps version
# or
cps --version

# List all providers
cps list
# Output example: * [anthropic] anthropic (...)

# Interactive selection
cps select

# Switch by id
cps use anthropic

# Add custom provider
cps add my-provider \
  --id my-provider \
  --base-url https://api.example.com \
  --token sk-xxx \
  --model claude-3-5-sonnet

# Use stdin for token (safer, avoids shell history)
echo "sk-xxx" | cps add my-provider \
  --id my-provider \
  --base-url https://api.example.com \
  --token-stdin \
  --model claude-3-5-sonnet
```

## CLI Command Reference

| Command | Description |
|---------|-------------|
| `cps list` | List all configured providers (shows id + name) |
| `cps current` | Show currently active provider |
| `cps version` | Show CLI version |
| `cps select` | Interactively select and apply a provider |
| `cps use <id>` | Switch to specified provider by id |
| `cps add <name>` | Add a new provider (optional `--id` for stable id) |
| `cps remove <name>` | Remove a provider |
| `cps serve` | Start the Web UI server |

`--id` rules: lowercase letters, numbers, and hyphens (`-`) only, max 24 characters, must be unique.

> **Security Note**: `--token` exposes secrets in shell history. Prefer `--token-stdin` when possible.

## Preset Providers

On first run, the following presets are automatically created:

| Provider | Description |
|----------|-------------|
| `anthropic` | Official API, run `claude code /login` first |
| `智谱Coding Plan` | Zhipu AI Coding Plan |
| `火山方舟Coding Plan` | Volcengine Ark Coding Plan |
| `custom` | Placeholder for custom configuration |

## Configuration

### Default Paths

- **Provider Config**: `~/.config/claude-provider-switch/config.json`
- **Claude Settings**: `~/.claude/settings.json`
- **Backup Files**: `~/.config/claude-provider-switch/backups/settings.backup-*.json` (keeps last 3)

### Environment Variables

Override default paths via environment variables:

```bash
export CPS_CONFIG_PATH=/path/to/config.json
export CPS_CONFIG_DIR=/path/to/config/dir
export CPS_BACKUP_DIR=/path/to/backup/dir
export CPS_CLAUDE_SETTINGS_PATH=/path/to/settings.json
export CPS_CLAUDE_DIR=/path/to/claude/dir
```

## Development

```bash
# Clone repository
git clone https://github.com/ladieman217/claude-provider-switcher.git
cd claude-provider-switcher

# Install dependencies
pnpm install

# Development mode (starts both UI and API servers)
pnpm run dev

# Build
pnpm run build

# Test
pnpm run test
```

## FAQ

### Q: Claude Code doesn't pick up the new provider after switching?
**A:** Make sure to restart Claude Code after switching. If it still doesn't work, check if `~/.claude/settings.json` was updated.

### Q: How do I restore to the original configuration?
**A:** Backups are automatically created before each modification at `~/.config/claude-provider-switch/backups/`. You can restore manually or run `cps use anthropic` to switch back to the official API.

### Q: Web UI shows port already in use?
**A:** The service automatically tries ports after 8787, or specify a port manually: `cps serve --port 3000`.

### Q: How do I view backup history?
**A:** Backup files are saved at `~/.config/claude-provider-switch/backups/settings.backup-*.json`, keeping the last 3 copies.

### Q: Adding a provider shows "ID already exists"?
**A:** IDs must be unique. Use `cps list` to see existing IDs, or specify a different ID with `--id`.

## Contributing

Issues and Pull Requests are welcome!

## License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ for Claude Code users
</p>
