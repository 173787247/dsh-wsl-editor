# dsh-wsl-editor
> **Install set:** part of [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit). Prefer `KIT_SET=daily` | `llm` | `github` | `full` (see kit README). Fault tree: [TROUBLESHOOTING.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.md).


DeepSeek Harness plugin: Open a WSL Linux path in Windows Cursor, VS Code, or Notepad.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

## Where it sits

Opens a Linux path in Cursor, VS Code, or Notepad on Windows.

```mermaid
flowchart LR
  agent["dsh agent"] --> tool["win_editor"] --> win["Cursor / VS Code / Notepad"]
```

Suite diagram and version snapshot: [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit#how-the-pieces-fit). This plugin is **0.1.1** (full). Do not copy that matrix into this README.


## Compatibility

| Field | Value |
|-------|-------|
| **Plugin** | `dsh-wsl-editor` **0.1.1** |
| **Minimum dsh** | ≥ **0.1.2** (web UI one-shot `?token=` on Windows relay `:3081`) |
| **Latest verified** | See [dsh-wsl-kit Compatibility](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) (currently **`0.2.1-rc.5`**) — single source of truth for the suite |
| **Kit set** | `full` or install alone |
| **Cloud Flash** | Use model id **`deepseek-flash`** (V4.1 Flash) in `~/.dsh/settings.yaml` / `llm-deepseek` — not configured by this plugin |
| **Agent Teams** | Upstream experimental; not required here |

Suite floor versions: kit [`check-plugin-versions.sh`](https://github.com/173787247/dsh-wsl-kit/blob/master/scripts/check-plugin-versions.sh). Fault tree: [TROUBLESHOOTING.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.md).

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-editor
# or local:
dsh plugin --profile web add /absolute/path/to/dsh-wsl-editor
```

Restart `dsh web` and open a **new** session. Tools: `win_editor`, `win_editor_status`.

| Tool | Args | Notes |
|------|------|-------|
| `win_editor` | `path`, optional `editor`, `line`, `column` | Cursor/Code use `-g file:line:column`; notepad ignores line/column |
| `win_editor_status` | (none) | Reports which of cursor / code / notepad are on the Windows PATH |

## License

MIT
