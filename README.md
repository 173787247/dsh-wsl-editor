# dsh-wsl-editor

DeepSeek Harness tool: **`win_editor`** — open a Linux path in a Windows IDE (Cursor/VS Code/Notepad).

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

---

## Why

Agents in WSL often need to open a file in **Cursor / VS Code** on Windows. Unlike `dsh-wsl-open` (default app), this tool is IDE-focused and allowlisted, converting paths with `wslpath -w` then `Start-Process`.

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-editor
```

Restart `dsh web`. New session → Tools should list `win_editor`.

## Config

```yaml
- id: dsh-wsl-editor
  name: dsh-wsl-editor
  config:
    timeoutMs: 15000
    defaultEditor: cursor
    allowlist: [cursor, code, code-insiders, notepad.exe]
```

| Key | Default | Meaning |
|-----|---------|---------|
| `timeoutMs` | `15000` | Tool timeout |
| `defaultEditor` | `cursor` | Default editor name |
| `allowlist` | cursor, code, code-insiders, notepad.exe | Allowed binaries |

## Test

```sh
npm test
```

## License

MIT
