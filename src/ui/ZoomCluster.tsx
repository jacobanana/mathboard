// The zoom cluster (#zoomCluster): − / 100% / +. Ported from the prototype
// (markup line 120, zoomAt + handlers lines 330-332).
//
// zoomAt(factor, cx, cy) keeps the point (cx, cy) fixed on screen while
// scaling, clamped to [MIN_SCALE, MAX_SCALE]. The − / + buttons zoom about the
// stage centre; the middle button (showing the current %) resets to 100%.
//
// The stage size is supplied by the host via getStageSize() so this component
// stays decoupled from the canvas/DOM. It drives camera via store.setCamera.

import { useBoardStore } from "@/board/store";
import { clamp, MIN_SCALE, MAX_SCALE } from "@/board/geometry";

interface ZoomClusterProps {
  /** Current stage (canvas) size in CSS px, for centring the zoom. */
  getStageSize: () => { w: number; h: number };
}

export function ZoomCluster({ getStageSize }: ZoomClusterProps): JSX.Element {
  const camera = useBoardStore((s) => s.camera);
  const setCamera = useBoardStore((s) => s.setCamera);

  function zoomAt(factor: number, cx: number, cy: number): void {
    const s = clamp(camera.scale * factor, MIN_SCALE, MAX_SCALE);
    const f = s / camera.scale;
    setCamera({
      x: cx - (cx - camera.x) * f,
      y: cy - (cy - camera.y) * f,
      scale: s,
    });
  }

  function zoomAtCentre(factor: number): void {
    const { w, h } = getStageSize();
    zoomAt(factor, w / 2, h / 2);
  }

  return (
    <div id="zoomCluster">
      <button id="zoomOut" title="Zoom out" onClick={() => zoomAtCentre(1 / 1.2)}>
        −
      </button>
      <button
        id="zoomReset"
        title="Reset to 100%"
        onClick={() => zoomAtCentre(1 / camera.scale)}
      >
        {Math.round(camera.scale * 100) + "%"}
      </button>
      <button id="zoomIn" title="Zoom in" onClick={() => zoomAtCentre(1.2)}>
        +
      </button>
    </div>
  );
}
