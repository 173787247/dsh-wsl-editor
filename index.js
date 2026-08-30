import { detectWsl, runPowerShell } from "./lib/wsl-host.js";
import {
  DEFAULT_ALLOWLIST,
  formatEditorResult,
  resolveEditor,
  startProcessScript,
  toWindowsPath,
} from "./lib/editor.js";

export const name = "dsh-wsl-editor";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const allowlist = Array.isArray(config.allowlist) && config.allowlist.length
    ? config.allowlist
    : DEFAULT_ALLOWLIST;
  const defaultEditor = typeof config.defaultEditor === "string"
    ? config.defaultEditor
    : "cursor";
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:win_editor",
    order: 126,
    text: [
      "Use win_editor to open a Linux path in a Windows IDE (Cursor, VS Code, Insiders, or Notepad).",
      "This is IDE-focused and allowlisted — distinct from dsh-wsl-open (default OS app association).",
      "Convert via wslpath -w, then Start-Process on Windows.",
    ].join(" "),
  });

  ctx.tools.register({
    name: "win_editor",
    description:
      "Open a Linux path in an allowlisted Windows IDE (cursor/code/code-insiders/notepad.exe).",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["path"],
      properties: {
        path: {
          type: "string",
          description: "Absolute or relative Linux path to open.",
        },
        editor: {
          type: "string",
          description: `Editor binary (default ${defaultEditor}). Allowlist: ${allowlist.join(", ")}`,
        },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          ok: { type: "boolean" },
          editor: { type: "string" },
          linuxPath: { type: "string" },
          windowsPath: { type: "string" },
          error: { type: "string" },
        },
      },
      render: (_args, value) => [{ type: "text", text: formatEditorResult(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => false,
    async execute(args) {
      if (!wsl) {
        return { ok: false, error: "not running in WSL" };
      }
      const linuxPath = typeof args?.path === "string" ? args.path.trim() : "";
      if (!linuxPath) return { ok: false, error: "missing path" };
      const resolved = resolveEditor(args?.editor || defaultEditor, allowlist);
      if (!resolved.ok) return { ok: false, error: resolved.error };
      try {
        const windowsPath = await toWindowsPath(linuxPath);
        if (!windowsPath) return { ok: false, error: "wslpath returned empty" };
        await runPowerShell(startProcessScript(resolved.editor, windowsPath), { timeoutMs });
        return {
          ok: true,
          editor: resolved.editor,
          linuxPath,
          windowsPath,
        };
      } catch (err) {
        return {
          ok: false,
          editor: resolved.editor,
          linuxPath,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    presentCall: () => ({ card: "generic", title: "Windows editor" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "Windows editor failed", content: result.content }
        : { card: "generic", title: "Windows editor", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
