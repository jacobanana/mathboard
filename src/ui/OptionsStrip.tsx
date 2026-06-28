// The contextual options strip (#options). Ported from the prototype's
// renderOptions / addColours / addPenSizes / addTextSizes (lines 187-190).
//
//   tool === "pen"  -> colour swatches + pen sizes (S/M/L = 3/6/12).
//   tool === "text" -> colour swatches + text sizes (S/M/L = 18/26/40).
//   otherwise        -> empty (#options:empty is hidden by CSS).
//
// Selecting a colour or size updates the store's ephemeral drawing state
// (color / penSize / textSize). Additionally — mirroring the prototype, where
// changing colour/size while a text object is selected or being edited mutates
// that object live — when a TEXT object is the current selection (or is being
// edited via the overlay), the change is also written back through
// updateObject so the object updates immediately.

import { useBoardStore } from "@/board/store";
import {
  PALETTE,
  PEN_SIZES,
  TEXT_SIZES,
  TEXT_SIZE_GLYPH,
} from "@/ui/constants";
import { textSizeOf } from "@/canvas/drawHelpers";

/** The text object currently being styled, if any (editing wins over select).
 *  For selection, only a lone selected object qualifies (not a multi-select). */
function useActiveTextObjectId(): string | null {
  return useBoardStore((s) => {
    const id =
      s.editingId ??
      (s.selection.objectIds.length === 1 && s.selection.strokeIds.length === 0
        ? s.selection.objectIds[0]
        : null);
    if (id == null) return null;
    const o = s.board.objects.find((obj) => obj.id === id);
    return o && o.type === "text" ? o.id : null;
  });
}

export function OptionsStrip(): JSX.Element | null {
  const tool = useBoardStore((s) => s.tool);
  const color = useBoardStore((s) => s.color);
  const penSize = useBoardStore((s) => s.penSize);
  const textSize = useBoardStore((s) => s.textSize);
  const setColor = useBoardStore((s) => s.setColor);
  const setPenSize = useBoardStore((s) => s.setPenSize);
  const setTextSize = useBoardStore((s) => s.setTextSize);
  const updateObject = useBoardStore((s) => s.updateObject);
  const activeTextId = useActiveTextObjectId();

  if (tool !== "pen" && tool !== "text") {
    // Render nothing inside #options; CSS hides it when empty.
    return <div className="group" id="options" />;
  }

  function pickColour(hex: string): void {
    setColor(hex);
    if (activeTextId != null) updateObject(activeTextId, { color: hex });
  }

  function pickTextSize(px: number): void {
    setTextSize(px);
    if (activeTextId != null) {
      // Re-measure so the bounding box stays correct (prototype autoSize).
      const obj = useBoardStore
        .getState()
        .board.objects.find((o) => o.id === activeTextId);
      const text = (obj?.text as string) ?? "";
      const { w, h } = textSizeOf(text, px);
      updateObject(activeTextId, { size: px, w, h });
    }
  }

  return (
    <div className="group" id="options">
      {/* Colour swatches (shared by pen + text). */}
      {PALETTE.map(([name, hex]) => (
        <button
          key={hex}
          className={"swatch" + (color === hex ? " active" : "")}
          style={{ background: hex }}
          title={name}
          onClick={() => pickColour(hex)}
        />
      ))}

      <span className="opt-sep" />

      {tool === "pen"
        ? PEN_SIZES.map(([lbl, px]) => (
            <button
              key={lbl}
              className={"btn small" + (penSize === px ? " active" : "")}
              title={lbl + " pen"}
              onClick={() => setPenSize(px)}
            >
              <span
                className="size-dot"
                style={{
                  width: Math.max(6, px),
                  height: Math.max(6, px),
                  background: "currentColor",
                }}
              />
            </button>
          ))
        : TEXT_SIZES.map(([lbl, px], i) => (
            <button
              key={lbl}
              className={"btn small" + (textSize === px ? " active" : "")}
              title={lbl + " text"}
              onClick={() => pickTextSize(px)}
            >
              <span
                style={{ fontWeight: 800, fontSize: TEXT_SIZE_GLYPH[i] }}
              >
                A
              </span>
            </button>
          ))}
    </div>
  );
}
