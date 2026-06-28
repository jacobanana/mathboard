// The floating edit / delete buttons over a single selected item (.floatbtn).
// Ported from the prototype (markup lines 118-119, updateOverlays line 335).
//
// Shown only when tool === "select" AND exactly ONE item is selected (an object
// or a drawn stroke). Multi-selection relies on the toolbar Delete button /
// Delete key instead. The Edit button appears only for an object (a stroke has
// no settings dialog). Positioned by projecting the item's top-right corner to
// screen space via worldToScreen and clamping to the stage, like the prototype:
//   delete: left = clamp(tr.x - 6, 42, W - 36)
//   edit:   left = clamp(tr.x - 44, 2, W - 76)
//   both:   top  = clamp(tr.y - 34, 2, H - 36)
//
// The .floatbtn rule is position:absolute, so these must live INSIDE #stage to
// be positioned in canvas-relative space. BoardCanvas owns #stage and doesn't
// accept children, so we portal into it (the host passes the stage element).
//
// Edit delegates to the host (onEditSelected) so the same edit-routing as the
// toolbar/double-click is reused; delete calls store.deleteSelection directly.

import { createPortal } from "react-dom";
import { useBoardStore } from "@/board/store";
import { worldToScreen, clamp, strokeBounds } from "@/board/geometry";
import { DrawIcon, GLYPH } from "@/ui/icons";

interface FloatButtonsProps {
  /** The #stage element to portal into (null until BoardCanvas has mounted). */
  container: HTMLElement | null;
  onEditSelected: () => void;
}

export function FloatButtons({
  container,
  onEditSelected,
}: FloatButtonsProps): JSX.Element | null {
  const tool = useBoardStore((s) => s.tool);
  const camera = useBoardStore((s) => s.camera);
  const selection = useBoardStore((s) => s.selection);
  const objects = useBoardStore((s) => s.board.objects);
  const strokes = useBoardStore((s) => s.board.strokes);
  const deleteSelection = useBoardStore((s) => s.deleteSelection);

  if (container == null) return null;
  if (tool !== "select") return null;
  if (selection.objectIds.length + selection.strokeIds.length !== 1) return null;

  // Resolve the single selected item's bounding box (world coords) and whether
  // it is an editable object.
  let bounds: { x: number; y: number; w: number; h: number } | null = null;
  let canEdit = false;
  if (selection.objectIds.length === 1) {
    const o = objects.find((x) => x.id === selection.objectIds[0]);
    if (o) {
      bounds = { x: o.x, y: o.y, w: o.w, h: o.h };
      canEdit = true;
    }
  } else {
    const s = strokes.find((x) => x.id === selection.strokeIds[0]);
    if (s) bounds = strokeBounds(s);
  }
  if (bounds == null) return null;

  const r = container.getBoundingClientRect();
  const W = r.width;
  const H = r.height;
  const tr = worldToScreen(camera, bounds.x + bounds.w, bounds.y);
  const top = clamp(tr.y - 34, 2, H - 36);

  return createPortal(
    <>
      {canEdit && (
        <button
          className="floatbtn show"
          id="floatEdit"
          title="Edit this object"
          style={{ left: clamp(tr.x - 44, 2, W - 76), top }}
          onClick={onEditSelected}
        >
          <DrawIcon />
        </button>
      )}
      <button
        className="floatbtn show"
        id="floatDel"
        title="Delete"
        style={{ left: clamp(tr.x - 6, 42, W - 36), top }}
        onClick={() => deleteSelection()}
      >
        {GLYPH.delete}
      </button>
    </>,
    container,
  );
}
