import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format, formatStatus, gotoTarget } from "../lib/editor.js";

describe("win_editor", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });

  it("builds goto target file:line:column", () => {
    assert.equal(gotoTarget("C:\\a.ts", 10, 5), "C:\\a.ts:10:5");
    assert.equal(gotoTarget("C:\\a.ts", 10), "C:\\a.ts:10");
    assert.equal(gotoTarget("C:\\a.ts"), "C:\\a.ts");
    assert.equal(gotoTarget("C:\\a.ts", 0, 1), "C:\\a.ts");
  });

  it("formats status", () => {
    assert.match(
      formatStatus({ ok: true, editors: { cursor: true, code: false, notepad: true } }),
      /cursor: available/,
    );
  });
});
