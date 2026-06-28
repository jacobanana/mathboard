// A tiny one-field prompt for naming a board (Save as / Rename). Renders ONLY
// the card body (<h2>, the input row, .card-actions) per the dialog contract —
// the host wraps it in <Modal>, or the BoardsManager swaps it into its own card.
//
// Enter confirms, Escape cancels; the field autofocuses and selects its initial
// text. Confirm is disabled until the trimmed name is non-empty.

import { useEffect, useRef, useState } from "react";

interface NamePromptProps {
  title: string;
  /** Pre-filled value (e.g. the existing name when renaming). */
  initial?: string;
  /** Label on the confirm button (default "Save"). */
  confirmLabel?: string;
  /** Called with the trimmed, non-empty name. */
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function NamePrompt({
  title,
  initial = "",
  confirmLabel = "Save",
  onSubmit,
  onCancel,
}: NamePromptProps): JSX.Element {
  const [name, setName] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const trimmed = name.trim();
  const submit = (): void => {
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <>
      <h2>{title}</h2>
      <div className="namefield">
        <input
          ref={ref}
          type="text"
          value={name}
          placeholder="Board name"
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
      </div>
      <div className="card-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={!trimmed}
          onClick={submit}
        >
          {confirmLabel}
        </button>
      </div>
    </>
  );
}
