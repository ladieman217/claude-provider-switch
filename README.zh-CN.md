# Claude Provider Switcher

[![npm version](https://img.shields.io/npm/v/claude-provider-switch)](https://www.npmjs.com/package/claude-provider-switch)
[![license](https://img.shields.io/npm/l/claude-provider-switch)](LICENSE)
![node version](https://img.shields.io/node/v/claude-provider-switch)

一键切换 Claude Code 的 API Provider。支持 Anthropic 官方 API 或任何兼容 Anthropic API 格式的第三方服务（如智谱、火山方舟等）。

<p align="center">
  <img src="docs/screenshot-ui.png" alt="Web UI 截图" width="720">
</p>

## 为什么需要这个工具？

- **多 Provider 管理** — 同时配置多个 API 提供商，随时切换
- **避免手动改配置** — 自动管理 `~/.claude/settings.json`，无需手动编辑
- **安全备份** — 每次修改前自动备份，可随时恢复
- **可视化界面** — 除了 CLI，还提供了直观的 Web UI

## 安装

### 全局安装（推荐）

```bash
npm install -g claude-provider-switch
# 或使用 pnpm
pnpm add -g claude-provider-switch
```

### 使用 npx（无需安装）

```bash
npx claude-provider-switch serve
```

### 环境要求

- **Node.js >= 18**

## 快速开始

### 1. 启动 Web UI（推荐）

```bash
cps serve
```

然后打开 http://localhost:8787 即可通过界面管理 Provider。

### 2. 使用 CLI

```bash
# 查看当前配置
cps current

# 查看版本
cps version
# 或
cps --version

# 列出所有 Provider
cps list
# 输出示例：* [anthropic] anthropic (...)

# 交互式选择 Provider
cps select

# 按 id 切换
cps use anthropic

# 添加自定义 Provider
cps add my-provider \
  --id my-provider \
  --base-url https://api.example.com \
  --token sk-xxx \
  --model claude-3-5-sonnet

# 使用 stdin 输入 token（更安全，避免历史记录泄露）
echo "sk-xxx" | cps add my-provider \
  --id my-provider \
  --base-url https://api.example.com \
  --token-stdin \
  --model claude-3-5-sonnet
```

## CLI 命令参考

| 命令 | 描述 |
|------|------|
| `cps list` | 列出所有配置的 Provider（显示 id + name） |
| `cps current` | 显示当前使用的 Provider |
| `cps version` | 显示当前 CLI 版本 |
| `cps select` | 交互式选择并应用 Provider |
| `cps use <id>` | 按 id 切换到指定的 Provider |
| `cps add <name>` | 添加新的 Provider（可选 `--id` 指定稳定 id） |
| `cps remove <name>` | 删除指定的 Provider |
| `cps serve` | 启动 Web UI 服务 |

`--id` 规则：仅支持小写字母、数字和连字符（`-`），最长 24 字符，且必须唯一。

> **安全提示**：`--token` 会将密钥暴露在命令历史中，建议优先使用 `--token-stdin` 方式。

## 预设 Provider

首次运行时会自动创建以下预设配置：

| Provider | 说明 |
|----------|------|
| `anthropic` | 官方 API，需先运行 `claude code /login` 登录 |
| `智谱Coding Plan` | 智谱 AI 的 Coding 套餐 |
| `火山方舟Coding Plan` | 火山方舟的 Coding 套餐 |

## 配置说明

### 默认路径

- **Provider 配置**：`~/.config/claude-provider-switch/config.json`
- **Claude 设置**：`~/.claude/settings.json`
- **备份文件**：`~/.config/claude-provider-switch/backups/settings.backup-*.json`（保留最近 3 份）

### 环境变量

可通过以下环境变量覆盖默认路径：

```bash
export CPS_CONFIG_PATH=/path/to/config.json
export CPS_CONFIG_DIR=/path/to/config/dir
export CPS_BACKUP_DIR=/path/to/backup/dir
export CPS_CLAUDE_SETTINGS_PATH=/path/to/settings.json
export CPS_CLAUDE_DIR=/path/to/claude/dir
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/ladieman217/claude-provider-switcher.git
cd claude-provider-switcher

# 安装依赖
pnpm install

# 开发模式（同时启动 UI 和 API 服务）
pnpm run dev

# 构建
pnpm run build

# 测试
pnpm run test
```

## 常见问题

### Q: 切换 Provider 后 Claude Code 没有生效？
A: 确保切换后重启 Claude Code。如果仍不生效，检查 `~/.claude/settings.json` 是否已更新。

### Q: 如何恢复到原始配置？
A: 每次修改前会自动备份到 `~/.config/claude-provider-switch/backups/`，你可以手动恢复或运行 `cps use anthropic` 切回官方 API。

### Q: Web UI 启动时提示端口被占用？
A: 服务会自动尝试 8787 之后的端口，或手动指定端口：`cps serve --port 3000`。

### Q: 如何查看历史备份？
A: 备份文件保存在 `~/.config/claude-provider-switch/backups/settings.backup-*.json`，保留最近 3 份。

### Q: 添加 Provider 时提示 ID 已存在？
A: ID 必须唯一，使用 `cps list` 查看已存在的 ID，或用 `--id` 指定一个不同的 ID。

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ for Claude Code users
</p>
