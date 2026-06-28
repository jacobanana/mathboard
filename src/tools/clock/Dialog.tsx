// Settings dialog for the Clock tool.
//
// Conventions (see src/tools/numberline/Dialog.tsx):
//   - Props are ToolDialogProps<ClockParams>: { initial?, onSubmit, onCancel }.
//   - Renders ONLY the card body; the host renders the #scrim / .card wrapper.
//   - EDIT vs CREATE decided by `initial`:
//       present -> editing  -> buttons "Cancel" / "Save".
//       absent  -> creating -> buttons "Back"   / "Add to board".
//
// Ported verbatim from clockDialog (maths-whiteboard.html lines 560-569). The
// prototype clock dialog has no error line and no validation beyond clamping
// hour to 0-23 and minute to 0-59 with `clamp(parseInt(...)||0, lo, hi)`.

import { useState } from "react";
import type { ToolDialogProps } from "@/tools/registry";
import { clamp } from "@/board/geometry";
import type { ClockParams } from "@/tools/clock";

export function ClockDialog({
  initial,
  onSubmit,
  onCancel,
}: ToolDialogProps<ClockParams>) {
  const editing = initial != null;

  const [hour, setHour] = useState(String(initial ? initial.hour : 3));
  const [minute, setMinute] = useState(String(initial ? initial.minute : 45));
  const [blank, setBlank] = useState(initial ? !!initial.blank : false);
  const [show12, setShow12] = useState(initial ? !!initial.show12 : true);
  const [show24, setShow24] = useState(initial ? !!initial.show24 : true);

  function submit() {
    onSubmit({
      hour: clamp(parseInt(hour, 10) || 0, 0, 23),
      minute: clamp(parseInt(minute, 10) || 0, 0, 59),
      blank,
      show12,
      show24,
    });
  }

  return (
    <>
      <h2>Clock</h2>
      <p className="hint">
        Set a time to read, or leave it blank to draw the hands.
      </p>

      <div className="field">
        <label htmlFor="clkH">Hour (0–23)</label>
        <input
          id="clkH"
          type="number"
          min="0"
          max="23"
          value={hour}
          onChange={(e) => setHour(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="clkM">Minutes</label>
        <input
          id="clkM"
          type="number"
          min="0"
          max="59"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
        />
      </div>
      <label className="field check">
        <input
          id="clkBlank"
          type="checkbox"
          checked={blank}
          onChange={(e) => setBlank(e.target.checked)}
        />
        <span>Blank face (draw the hands yourself)</span>
      </label>
      <label className="field check">
        <input
          id="clk12"
          type="checkbox"
          checked={show12}
          onChange={(e) => setShow12(e.target.checked)}
        />
        <span>Show 12-hour time (am/pm)</span>
      </label>
      <label className="field check">
        <input
          id="clk24"
          type="checkbox"
          checked={show24}
          onChange={(e) => setShow24(e.target.checked)}
        />
        <span>Show 24-hour time</span>
      </label>

      <div className="card-actions">
        <button className="btn" id="clkCancel" onClick={onCancel}>
          {editing ? "Cancel" : "Back"}
        </button>
        <button className="btn primary" id="clkAdd" onClick={submit}>
          {editing ? "Save" : "Add to board"}
        </button>
      </div>
    </>
  );
}
