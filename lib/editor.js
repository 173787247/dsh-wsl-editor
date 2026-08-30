import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const DEFAULT_ALLOWLIST = ["cursor", "code", "code-insiders", "notepad.exe"];

export function normalizeAllowlist(list) {
  const src = Array.isArray(list) && list.length ? list : DEFAULT_ALLOWLIST;
  return src.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
}

export function resolveEditor(name, allowlist = DEFAULT_ALLOWLIST) {
  const n = String(name || "").trim().toLowerCase();
  const allowed = normalizeAllowlist(allowlist);
  if (!n || !allowed.includes(n)) {
    return { ok: false, error: `editor not in allowlist: ${name || "(empty)"}` };
  }
  // notepad.exe stays as-is; others are PATH commands on Windows.
  return { ok: true, editor: n };
}

export async function toWindowsPath(linuxPath, { execFileFn = execFileAsync } = {}) {
  const { stdout } = await execFileFn("wslpath", ["-w", linuxPath], {
    encoding: "utf8",
    timeout: 5_000,
  });
  return String(stdout || "").trim();
}

export function startProcessScript(editor, winPath) {
  const ed = String(editor).replace(/'/g, "''");
  const wp = String(winPath).replace(/'/g, "''");
  return `Start-Process -FilePath '${ed}' -ArgumentList @('${wp}')`;
}

export function formatEditorResult(payload) {
  const lines = ["win_editor"];
  if (payload.ok === false) {
    lines.push(`error: ${payload.error || "failed"}`);
    return lines.join("\n");
  }
  lines.push(`editor: ${payload.editor}`);
  lines.push(`linux: ${payload.linuxPath}`);
  lines.push(`windows: ${payload.windowsPath}`);
  lines.push("status: launched");
  return lines.join("\n");
}
