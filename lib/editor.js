import { existsSync, realpathSync } from "node:fs";
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
      line: {
        type: "integer",
        description: "1-based line to open (Cursor/VS Code only; notepad ignores).",
      },
      column: {
        type: "integer",
        description: "1-based column (Cursor/VS Code only; requires line).",
      },
    },
  };
}

export function statusParameters() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {},
  };
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}

export function format(v) {
  const lines = [`win_editor ok=${v.ok} editor=${v.editor || "?"} path=${v.path || "?"}`];
  if (v.windowsPath) lines.push(`windowsPath: ${v.windowsPath}`);
  if (v.line != null) lines.push(`line: ${v.line}`);
  if (v.column != null) lines.push(`column: ${v.column}`);
  if (v.error) lines.push(`error: ${v.error}`);
  return lines.join("\n");
}

export function formatStatus(v) {
  if (!v.ok) return `win_editor_status failed: ${v.error || "?"}`;
  const eds = v.editors || {};
  return [
    "win_editor_status ok=true",
    `cursor: ${eds.cursor ? "available" : "missing"}`,
    `code: ${eds.code ? "available" : "missing"}`,
    `notepad: ${eds.notepad ? "available" : "missing"}`,
  ].join("\n");
}

/** Build Cursor/VS Code goto target: file, file:line, or file:line:column. */
export function gotoTarget(windowsPath, line, column) {
  const win = String(windowsPath || "");
  const l = Number(line);
  if (!Number.isFinite(l) || l < 1) return win;
  const c = Number(column);
  if (Number.isFinite(c) && c >= 1) return `${win}:${Math.trunc(l)}:${Math.trunc(c)}`;
  return `${win}:${Math.trunc(l)}`;
}

async function toWindows(abs) {
  try {
    const { stdout } = await execFileAsync("wslpath", ["-w", abs], { timeout: 5000, encoding: "utf8" });
    return String(stdout).trim();
  } catch {
    return "";
  }
}

function escapePsSingle(s) {
  return String(s).replace(/'/g, "''");
}

export async function execute(args) {
  const raw = typeof args?.path === "string" ? args.path.trim() : "";
  if (!raw) return { ok: false, error: "missing path" };
  const abs = raw.startsWith("~/") ? `${homedir()}${raw.slice(1)}` : resolve(raw);
  if (!abs.startsWith("/")) return { ok: false, path: abs, error: "Linux absolute path required" };
  if (!existsSync(abs)) return { ok: false, path: abs, error: "path not found" };
  const win = await toWindows(realpathSync(abs));
  if (!win) return { ok: false, path: abs, error: "wslpath failed" };

  const line = args?.line;
  const column = args?.column;
  const pref = args?.editor || "auto";
  const order = pref === "auto" ? ["cursor", "code", "notepad"] : [pref];
  const target = gotoTarget(win, line, column);
  const hasGoto = target !== win;

  for (const editor of order) {
    try {
      if (editor === "notepad") {
        // Notepad has no reliable line/column goto; open file only.
        await runPowerShell(
          `Start-Process notepad.exe -ArgumentList @('${escapePsSingle(win)}')`,
          { timeoutMs: 15_000 },
        );
      } else {
        const argsList = hasGoto
          ? `@('-g', '${escapePsSingle(target)}')`
          : `@('${escapePsSingle(win)}')`;
        await runPowerShell(
          `Start-Process '${editor}.exe' -ArgumentList ${argsList}`,
          { timeoutMs: 15_000 },
        );
      }
      const out = { ok: true, path: abs, windowsPath: win, editor };
      if (hasGoto && editor !== "notepad") {
        const l = Number(line);
        if (Number.isFinite(l) && l >= 1) out.line = Math.trunc(l);
        const c = Number(column);
        if (Number.isFinite(c) && c >= 1) out.column = Math.trunc(c);
      }
      return out;
    } catch {
      // try next
    }
  }
  return { ok: false, path: abs, windowsPath: win, error: "no editor launched" };
}

export async function executeStatus() {
  const ps = `
$names = @('cursor','code','notepad');
$result = @{};
foreach ($n in $names) {
  $cmd = Get-Command ($n + '.exe') -ErrorAction SilentlyContinue;
  if (-not $cmd) { $cmd = Get-Command $n -ErrorAction SilentlyContinue };
  $result[$n] = [bool]$cmd;
}
($result | ConvertTo-Json -Compress)
`;
  try {
    const { stdout } = await runPowerShell(ps, { timeoutMs: 15_000 });
    const raw = String(stdout || "").trim();
    const jsonLine = raw.split(/\r?\n/).filter(Boolean).pop() || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(jsonLine);
    } catch {
      return { ok: false, error: "failed to parse Get-Command result", raw };
    }
    return {
      ok: true,
      editors: {
        cursor: Boolean(parsed.cursor),
        code: Boolean(parsed.code),
        notepad: Boolean(parsed.notepad),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
