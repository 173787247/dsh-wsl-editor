import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/editor.js";

export const name = "dsh-wsl-editor";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:win_editor",
    order: 118,
    text: "Use win_editor to open a WSL Linux path in Windows Cursor/VS Code/Notepad (optional line/column for Cursor/Code). Use win_editor_status to see which editors are on PATH.",
  });

  ctx.tools.register({
    name: "win_editor",
    description: "Open a WSL Linux path in Windows Cursor/VS Code/Notepad. Optional line/column for Cursor/Code (-g file:line:column).",
    parameters: core.parameters(config),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return core.notWsl ? core.notWsl() : { ok: false, error: "not running in WSL" };
      return core.execute(args, config);
    },
    presentCall: () => ({ card: "generic", title: "win_editor" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "win_editor failed", content: result.content }
        : { card: "generic", title: "win_editor", content: result.content }
    ),
  });

  ctx.tools.register({
    name: "win_editor_status",
    description: "Probe which of cursor/code/notepad.exe are available on the Windows PATH (Get-Command).",
    parameters: core.statusParameters(),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.formatStatus(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute() {
      if (!wsl) return core.notWsl ? core.notWsl() : { ok: false, error: "not running in WSL" };
      return core.executeStatus();
    },
    presentCall: () => ({ card: "generic", title: "win_editor_status" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "win_editor_status failed", content: result.content }
        : { card: "generic", title: "win_editor_status", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
