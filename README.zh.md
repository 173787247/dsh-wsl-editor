# dsh-wsl-editor

DeepSeek Harness 工具：**`win_editor`** — 在 Windows IDE 中打开 Linux 路径（Cursor/VS Code/Notepad）。

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。

[English → README.md](./README.md)

---

## 为什么需要

WSL 中的 agent 常需在 Windows 上用 **Cursor / VS Code** 打开文件。不同于 `dsh-wsl-open`（系统默认应用），本工具面向 IDE、有白名单，经 `wslpath -w` 后用 `Start-Process` 启动。

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-editor
```

重启 `dsh web`。新会话 → Tools 应出现 `win_editor`。

## 配置

```yaml
- id: dsh-wsl-editor
  name: dsh-wsl-editor
  config:
        timeoutMs: 15000
        defaultEditor: cursor
        allowlist: [cursor, code, code-insiders, notepad.exe]
```

| 键 | 默认 | 含义 |
|----|------|------|
| `timeoutMs` | `15000` | 工具超时 |
| `defaultEditor` | `cursor` | 默认编辑器 |
| `allowlist` | cursor, code, code-insiders, notepad.exe | 允许的可执行名 |

## 测试

```sh
npm test
```

## 许可

MIT
