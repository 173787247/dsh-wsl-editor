import { existsSync, realpathSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runPowerShell } from "./wsl-host.js";

const execFileAsync = promisify(execFile);

export function notWsl() {
  return { ok: false, error: "not running in WSL" };
}

export function parameters() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["path"],
    properties: {
      path: { type: "string", description: "Absolute Linux path (or ~/…) to open." },
      editor: {
        type: "string",
        enum: ["auto", "cursor", "code", "notepad"],
        description: "Editor preference (default auto: cursor → code → notepad).",
      },
    },
  };
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}

export function format(v) {
  const lines = [`win_editor ok=${v.ok} editor=${v.editor || "?"} path=${v.path || "?"}`];
  if (v.windowsPath) lines.push(`windowsPath: ${v.windowsPath}`);
  if (v.error) lines.push(`error: ${v.error}`);
  return lines.join("\n");
}

async function toWindows(abs) {
  try {
    const { stdout } = await execFileAsync("wslpath", ["-w", abs], { timeout: 5000, encoding: "utf8" });
    return String(stdout).trim();
  } catch {
    return "";
  }
}

export async function execute(args) {
  const raw = typeof args?.path === "string" ? args.path.trim() : "";
  if (!raw) return { ok: false, error: "missing path" };
  const abs = raw.startsWith("~/") ? `${homedir()}${raw.slice(1)}` : resolve(raw);
  if (!abs.startsWith("/")) return { ok: false, path: abs, error: "Linux absolute path required" };
  if (!existsSync(abs)) return { ok: false, path: abs, error: "path not found" };
  const win = await toWindows(realpathSync(abs));
  if (!win) return { ok: false, path: abs, error: "wslpath failed" };
  const pref = args?.editor || "auto";
  const order = pref === "auto" ? ["cursor", "code", "notepad"] : [pref];
  for (const editor of order) {
    try {
      if (editor === "notepad") {
        await runPowerShell(`Start-Process notepad.exe -ArgumentList @('${win.replace(/'/g, "''")}')`, { timeoutMs: 15_000 });
      } else {
        await runPowerShell(`Start-Process '${editor}.exe' -ArgumentList @('${win.replace(/'/g, "''")}')`, { timeoutMs: 15_000 });
      }
      return { ok: true, path: abs, windowsPath: win, editor };
    } catch {
      // try next
    }
  }
  return { ok: false, path: abs, windowsPath: win, error: "no editor launched" };
}
