// CanvasTool (canvas + dialog). Place-value columns frame.
//
// Ported from maths-whiteboard.html:
//   - objSize case 'placevalue' (line 203)
//   - drawPlaceValue (line 237)
//   - placeValueDialog (lines 470-475) -> ./Dialog.tsx
//
// The dialog is a single select mapping a key to a cols array; both key and
// cols are stored on the object.

import { defineCanvasTool } from "@/tools/registry";
import { fillPanel } from "@/canvas/drawHelpers";
import { PlaceValueDialog } from "@/tools/placevalue/Dialog";

export interface PlaceValueParams {
  key: string;
  cols: string[];
}

export default defineCanvasTool<PlaceValueParams>({
  kind: "canvas",
  type: "placevalue",
  name: "Place value",
  blurb: "columns & decimals",
  category: "number",

  defaults: () => ({ key: "ThHTO", cols: ["Th", "H", "T", "O"] }),

  size: (p) => {
    let w = 0;
    p.cols.forEach((c) => (w += c === "." ? 20 : 54));
    return { w, h: 36 + 46 * 3 };
  },

  draw: ({ ctx, theme, font }, o) => {
    const cols = o.cols;
    const isDot = (l: string) => l === ".";
    const unit = 54;
    const dotW = 20;
    const headerH = 36;
    const rowH = 46;
    const rows = 3;
    const xs: number[] = [];
    let cx = o.x;
    cols.forEach((c) => {
      xs.push(cx);
      cx += isDot(c) ? dotW : unit;
    });
    const xEnd = cx;
    const y0 = o.y;
    const tableH = headerH + rowH * rows;
    ctx.save();
    fillPanel(ctx, o);
    ctx.textAlign = "center";
    ctx.fillStyle = "#5C7A78";
    ctx.font = "700 13px " + font;
    cols.forEach((c, i) => {
      if (!isDot(c)) ctx.fillText(c, xs[i] + unit / 2, y0 + 23);
    });
    ctx.strokeStyle = "#9DB6B4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x, y0 + headerH);
    ctx.lineTo(xEnd, y0 + headerH);
    ctx.stroke();
    ctx.strokeStyle = "#D7E0DF";
    ctx.lineWidth = 1;
    for (let r = 1; r < rows; r++) {
      const ry = y0 + headerH + rowH * r;
      ctx.beginPath();
      ctx.moveTo(o.x, ry);
      ctx.lineTo(xEnd, ry);
      ctx.stroke();
    }
    const ansY = y0 + headerH + rowH * (rows - 1);
    ctx.strokeStyle = theme.lineInk;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(o.x, ansY);
    ctx.lineTo(xEnd, ansY);
    ctx.stroke();
    ctx.strokeStyle = "#C3D4D2";
    ctx.lineWidth = 1;
    cols.forEach((_c, i) => {
      if (i === 0) return;
      ctx.beginPath();
      ctx.moveTo(xs[i], y0 + headerH);
      ctx.lineTo(xs[i], y0 + tableH);
      ctx.stroke();
    });
    ctx.fillStyle = theme.lineInk;
    cols.forEach((c, i) => {
      if (!isDot(c)) return;
      for (let r = 0; r < rows; r++) {
        const py = y0 + headerH + rowH * r + rowH * 0.7;
        ctx.beginPath();
        ctx.arc(xs[i] + dotW / 2, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  },

  Dialog: PlaceValueDialog,
});
