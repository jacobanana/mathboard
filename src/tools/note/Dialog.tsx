// Dialog for the "Problem card" note tool.
//
// Conventions (see numberline/Dialog.tsx):
//   - Props are ToolDialogProps<P>: { initial?, onSubmit, onCancel }.
//   - Renders ONLY the card body; the host renders the #scrim / .card wrapper.
//   - EDIT vs CREATE is decided by `initial`:
//       initial present -> editing  -> buttons "Cancel" / "Save", title "Edit problem".
//       initial absent  -> creating -> buttons "Back"   / "Add to board", title "Problem card".
//
// Ported from noteDialog (maths-whiteboard.html lines 571-576). The prototype's
// HTML-escaping of the seed text is unnecessary here (React escapes values).
// Submit trims the text; an empty result cancels (onCancel) exactly as the
// prototype's `if(!text){ closeModal(); return; }`.

import { useState } from "react";
import type { ToolDialogProps } from "@/tools/registry";
import type { NoteParams } from "@/tools/note";

export function NoteDialog({
  initial,
  onSubmit,
  onCancel,
}: ToolDialogProps<NoteParams>) {
  const editing = initial != null;

  const [text, setText] = useState(initial ? initial.text || "" : "");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onSubmit({ text: trimmed });
  }

  return (
    <>
      <h2>{editing ? "Edit problem" : "Problem card"}</h2>
      <p className="hint">Type or paste the word problem.</p>

      <textarea
        id="noteText"
        rows={5}
        style={{
          width: "100%",
          fontFamily: "inherit",
          fontSize: "15px",
          border: "2px solid #E0E4E2",
          borderRadius: "10px",
          padding: "10px",
          resize: "vertical",
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="card-actions">
        <button className="btn" id="noteCancel" onClick={onCancel}>
          {editing ? "Cancel" : "Back"}
        </button>
        <button className="btn primary" id="noteAdd" onClick={submit}>
          {editing ? "Save" : "Add to board"}
        </button>
      </div>
    </>
  );
}
