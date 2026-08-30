import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatEditorResult,
  resolveEditor,
  startProcessScript,
} from "../lib/editor.js";

describe("win_editor", () => {
  it("allowlists editors", () => {
    assert.equal(resolveEditor("cursor").ok, true);
    assert.equal(resolveEditor("evil.exe").ok, false);
  });

  it("builds Start-Process script", () => {
    const s = startProcessScript("cursor", "C:\\Users\\a\\f.txt");
    assert.match(s, /Start-Process/);
    assert.match(s, /cursor/);
  });

  it("formats", () => {
    assert.match(
      formatEditorResult({ ok: true, editor: "cursor", linuxPath: "/a", windowsPath: "C:\\a" }),
      /status: launched/,
    );
  });
});
