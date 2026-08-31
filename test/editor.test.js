import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format } from "../lib/editor.js";

describe("win_editor", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });
});
