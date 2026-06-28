// CanvasTool (canvas + dialog): a coordinate grid for plotting and reading
// points. Copy of the numberline tool shape.
//
// Ported from maths-whiteboard.html: objSize case 'coordgrid' (line 212),
// drawCoordGrid (lines 258-265), coordGridDialog (lines 513-520).

import { defineCanvasTool } from "@/tools/registry";
import { fillPanel } from "@/canvas/drawHelpers";
import { CoordGridDialog } from "@/tools/coordgrid/Dialog";

export interface CoordGridParams {
  quad: number;
  max: number;
  points: [number, number][];
  pointsRaw: string;
}

export const coordGridTool = defineCanvasTool<CoordGridParams>({
  kind: "canvas",
  type: "coordgrid",
  name: "Coordinate grid",
  blurb: "plot · read points",
  category: "geometry",

  defaults: () => ({ quad: 4, max: 5, points: [], pointsRaw: "" }),

  size: (p) => {
    const min = p.quad === 4 ? -p.max : 0;
    const units = p.max - min;
    const unit = 28;
    return { w: 26 + units * unit + 14, h: 14 + units * unit + 22 };
  },

  draw: ({ ctx, theme, font }, o) => {
    const min = o.quad === 4 ? -o.max : 0;
    const max = o.max;
    const units = max - min;
    const unit = 28;
    const mL = 26;
    const mT = 14;
    const plotW = units * unit;
    const plotH = units * unit;
    const gx0 = o.x + mL;
    const gy0 = o.y + mT;
    const X = (v: number) => gx0 + (v - min) * unit;
    const Y = (v: number) => gy0 + (max - v) * unit;
    ctx.save();
    fillPanel(ctx, o);
    ctx.strokeStyle = "#D7E0DF";
    ctx.lineWidth = 1;
    for (let v = min; v <= max; v++) {
      ctx.beginPath();
      ctx.moveTo(X(v), gy0);
      ctx.lineTo(X(v), gy0 + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx0, Y(v));
      ctx.lineTo(gx0 + plotW, Y(v));
      ctx.stroke();
    }
    const ax0 = X(0);
    const ay0 = Y(0);
    ctx.strokeStyle = theme.lineInk;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(gx0, ay0);
    ctx.lineTo(gx0 + plotW, ay0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax0, gy0);
    ctx.lineTo(ax0, gy0 + plotH);
    ctx.stroke();
    const arrow = (x: number, y: number, dx: number, dy: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - dx * 9 - dy * 5, y - dy * 9 + dx * 5);
      ctx.moveTo(x, y);
      ctx.lineTo(x - dx * 9 + dy * 5, y - dy * 9 - dx * 5);
      ctx.stroke();
    };
    arrow(gx0 + plotW, ay0, 1, 0);
    arrow(ax0, gy0, 0, -1);
    if (o.quad === 4) {
      arrow(gx0, ay0, -1, 0);
      arrow(ax0, gy0 + plotH, 0, 1);
    }
    ctx.fillStyle = theme.muted;
    ctx.font = "600 11px " + font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const stepLbl = units > 12 ? 2 : 1;
    for (let v = min; v <= max; v++) {
      if (v === 0 || v % stepLbl !== 0) continue;
      ctx.fillText(String(v), X(v), ay0 + 11);
      ctx.fillText(String(v), ax0 - 13, Y(v));
    }
    if (o.points && o.points.length) {
      o.points.forEach(([px, py]) => {
        if (px < min || px > max || py < min || py > max) return;
        const sx = X(px);
        const sy = Y(py);
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = theme.lineInk;
        ctx.font = "700 12px " + font;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("(" + px + ", " + py + ")", sx + 8, sy - 7);
      });
    }
    ctx.restore();
  },

  Dialog: CoordGridDialog,
});

export default coordGridTool;
