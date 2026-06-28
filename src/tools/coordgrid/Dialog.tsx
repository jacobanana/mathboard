// Dialog for the coordinate grid tool. Renders only the card body; the host
// renders the #scrim / .card wrapper.
//
// Ported from coordGridDialog (maths-whiteboard.html lines 513-520). The form
// fields (Quadrants / Axis goes to / Plot points) match the prototype exactly,
// including the point-parsing regex and select options.

import { useState } from "react";
import type { ToolDialogProps } from "@/tools/registry";
import type { CoordGridParams } from "@/tools/coordgrid";

export function CoordGridDialog({
  initial,
  onSubmit,
  onCancel,
}: ToolDialogProps<CoordGridParams>) {
  const editing = initial != null;

  const [quad, setQuad] = useState(String(initial ? initial.quad : 4));
  const [max, setMax] = useState(String(initial ? initial.max : 5));
  const [pts, setPts] = useState(
    initial && initial.pointsRaw ? initial.pointsRaw : "",
  );

  function submit() {
    const q = parseInt(quad, 10);
    const m = parseInt(max, 10);
    const r = pts;
    const points: [number, number][] = [];
    r.split(/[;\n]/).forEach((seg) => {
      const mm = seg
        .trim()
        .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
      if (mm) points.push([parseFloat(mm[1]), parseFloat(mm[2])]);
    });
    onSubmit({ quad: q, max: m, points, pointsRaw: r });
  }

  return (
    <>
      <h2>Coordinate grid</h2>
      <p className="hint">
        A grid to plot and read coordinates. Points are optional.
      </p>

      <div className="field">
        <label htmlFor="cgQuad">Quadrants</label>
        <select
          id="cgQuad"
          value={quad}
          onChange={(e) => setQuad(e.target.value)}
        >
          <option value="4">Four (−,−) to (+,+)</option>
          <option value="1">One (positive only)</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="cgMax">Axis goes to</label>
        <select id="cgMax" value={max} onChange={(e) => setMax(e.target.value)}>
          {[5, 6, 8, 10].map((v) => (
            <option key={v} value={String(v)}>
              ±{v}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="cgPts">Plot points</label>
        <input
          id="cgPts"
          type="text"
          value={pts}
          onChange={(e) => setPts(e.target.value)}
          placeholder="2,3; -1,4"
          style={{ width: "170px", textAlign: "left" }}
        />
      </div>

      <div className="card-actions">
        <button className="btn" id="cgCancel" onClick={onCancel}>
          {editing ? "Cancel" : "Back"}
        </button>
        <button className="btn primary" id="cgAdd" onClick={submit}>
          {editing ? "Save" : "Add to board"}
        </button>
      </div>
    </>
  );
}
