// Place-value dialog. A single select mapping a key to a cols array.
//
// Ported from placeValueDialog (maths-whiteboard.html lines 470-475).
//   - initial present -> editing -> buttons "Cancel" / "Save".
//   - initial absent  -> creating -> buttons "Back"   / "Add to board".
//   - No validation in the prototype; the select always yields a valid key.

import { useState } from "react";
import type { ToolDialogProps } from "@/tools/registry";
import type { PlaceValueParams } from "@/tools/placevalue";

const opts: [string, string][] = [
  ["HTO", "Hundreds, Tens, Ones"],
  ["ThHTO", "Thousands → Ones"],
  ["TThThHTO", "Ten thousands → Ones"],
  ["Mills", "Millions → Ones"],
  ["HTOdth", "Ones · tenths, hundredths"],
  ["HTOd3", "Ones · tenths, hundredths, thousandths"],
];

const map: Record<string, string[]> = {
  HTO: ["H", "T", "O"],
  ThHTO: ["Th", "H", "T", "O"],
  TThThHTO: ["TTh", "Th", "H", "T", "O"],
  Mills: ["M", "HTh", "TTh", "Th", "H", "T", "O"],
  HTOdth: ["H", "T", "O", ".", "t", "h"],
  HTOd3: ["H", "T", "O", ".", "t", "h", "th"],
};

export function PlaceValueDialog({
  initial,
  onSubmit,
  onCancel,
}: ToolDialogProps<PlaceValueParams>) {
  const editing = initial != null;

  const [key, setKey] = useState(initial && initial.key ? initial.key : "ThHTO");

  function submit() {
    onSubmit({ cols: map[key], key });
  }

  return (
    <>
      <h2>Place value columns</h2>
      <p className="hint">
        Lined-up columns for column add/subtract, short multiplication and
        decimals.
      </p>

      <div className="field">
        <label htmlFor="pvType">Columns</label>
        <select
          id="pvType"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        >
          {opts.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="card-actions">
        <button className="btn" id="pvCancel" onClick={onCancel}>
          {editing ? "Cancel" : "Back"}
        </button>
        <button className="btn primary" id="pvAdd" onClick={submit}>
          {editing ? "Save" : "Add to board"}
        </button>
      </div>
    </>
  );
}
