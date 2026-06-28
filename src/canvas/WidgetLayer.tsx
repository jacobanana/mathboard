// Overlay layer for interactive WidgetTool objects (e.g. the type-and-check
// worksheet). Canvas objects draw onto the <canvas>; widget objects render as
// real React components positioned over the board.
//
// Ported from positionWidget / positionWidgets (maths-whiteboard.html lines
// 587-588): each widget is absolutely placed via worldToScreen and scaled by
// the camera scale (transform-origin 0 0, as set by .iworksheet in the CSS).
// The layer itself (.ilayer) is pointer-events:none; each widget re-enables
// pointer events for itself.

import { useBoardStore } from "@/board/store";
import { worldToScreen } from "@/board/geometry";
import { getTool } from "@/tools/registry";
import type { AnyBoardObject } from "@/board/types";

interface WidgetLayerProps {
  /** Open a widget's settings Dialog (EDIT flow); routed through App, same as
   *  BoardCanvas's onEditObject for canvas objects. */
  onEditObject?: (obj: AnyBoardObject) => void;
}

export function WidgetLayer({ onEditObject }: WidgetLayerProps) {
  // Re-render on board (objects) or camera change.
  const objects = useBoardStore((s) => s.board.objects);
  const camera = useBoardStore((s) => s.camera);

  const widgets = objects.filter((o) => {
    const t = getTool(o.type);
    return t?.kind === "widget";
  });

  return (
    <div className="ilayer">
      {widgets.map((o) => {
        const t = getTool(o.type);
        if (!t || t.kind !== "widget") return null;
        const s = worldToScreen(camera, o.x, o.y);
        const Component = t.Component;
        // Generic positioner only — each widget renders its own card (e.g. the
        // worksheet's .iworksheet), so we don't double-wrap with that class.
        return (
          <div
            key={o.id}
            style={{
              position: "absolute",
              left: s.x + "px",
              top: s.y + "px",
              transform: "scale(" + camera.scale + ")",
              transformOrigin: "0 0",
            }}
          >
            <Component
              obj={o as AnyBoardObject as never}
              onEdit={onEditObject ? () => onEditObject(o) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
