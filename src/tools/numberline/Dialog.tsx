// REFERENCE DIALOG. Copy this shape for any tool with a settings modal.
//
// Conventions (follow these verbatim):
//   - Props are ToolDialogProps<P>: { initial?, onSubmit, onCancel }.
//   - The dialog renders ONLY the card body (<h2>, hints, .field rows, .err,
//     and .card-actions). The host renders the #scrim / .card wrapper.
//   - EDIT vs CREATE is decided by `initial`:
//       initial present -> editing  -> buttons "Cancel" / "Save".
//       initial absent  -> creating -> buttons "Back"   / "Add to board".
//   - The form is presented in human terms (Start / End / Step) even though the
//     stored params are start/step/intervals. Convert in the submit handler.
//   - Validate on submit. On failure, set the .err text and DO NOT call onSubmit.
//   - On success, call onSubmit(params) with the exact stored param shape.
//
// Ported from numberLineDialog (maths-whiteboard.html lines 391-402).

import { useState } from "react";
import type { ToolDialogProps } from "@/tools/registry";
import type { NumberLineParams } from "@/tools/numberline";

export function NumberLineDialog({
  initial,
  onSubmit,
  onCancel,
}: ToolDialogProps<NumberLineParams>) {
  const editing = initial != null;

  // Form fields mirror the prototype's human-facing inputs.
  const [start, setStart] = useState(String(initial ? initial.start : 0));
  const [end, setEnd] = useState(
    String(initial ? initial.start + initial.step * initial.intervals : 10),
  );
  const [step, setStep] = useState(String(initial ? initial.step : 1));
  const [hide, setHide] = useState(initial ? initial.hide : false);
  const [err, setErr] = useState("");

  function submit() {
    const s = parseFloat(start);
    const en = parseFloat(end);
    const st = parseFloat(step);
    if ([s, en, st].some(Number.isNaN)) {
      setErr("Please fill in all three numbers.");
      return;
    }
    if (en <= s) {
      setErr("“End at” needs to be bigger than “Start at”.");
      return;
    }
    if (st <= 0) {
      setErr("Steps must be bigger than zero.");
      return;
    }
    const intervals = Math.round((en - s) / st);
    if (Math.abs(intervals * st - (en - s)) > 1e-6) {
      setErr("That step doesn’t divide the range evenly.");
      return;
    }
    if (intervals > 40) {
      setErr("Too many marks to read — use a bigger step.");
      return;
    }
    onSubmit({ start: s, step: st, intervals, hide });
  }

  return (
    <>
      <h2>Number line</h2>
      <p className="hint">Set the range, then place it on the board.</p>

      <div className="field">
        <label htmlFor="nlStart">Start at</label>
        <input
          id="nlStart"
          type="number"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="nlEnd">End at</label>
        <input
          id="nlEnd"
          type="number"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="nlStep">Count in steps of</label>
        <input
          id="nlStep"
          type="number"
          step="any"
          value={step}
          onChange={(e) => setStep(e.target.value)}
        />
      </div>
      <label className="field check">
        <input
          id="nlHide"
          type="checkbox"
          checked={hide}
          onChange={(e) => setHide(e.target.checked)}
        />
        <span>Leave numbers blank to fill in</span>
      </label>

      <p className="err" id="nlErr">
        {err}
      </p>
      <div className="card-actions">
        <button className="btn" id="nlCancel" onClick={onCancel}>
          {editing ? "Cancel" : "Back"}
        </button>
        <button className="btn primary" id="nlAdd" onClick={submit}>
          {editing ? "Save" : "Add to board"}
        </button>
      </div>
    </>
  );
}
