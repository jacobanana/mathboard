// CanvasTool (canvas + dialog): "Percentage of an amount".
//
// Ported from maths-whiteboard.html:
//   - size:   objSize case 'percamount' (line 215).
//   - draw:   drawPercAmount (line 284).
//   - dialog: percAmountDialog (lines 542-549) -> ./Dialog.tsx.
//
// Mechanical port only: tctx -> ctx; css('--line-ink') -> theme.lineInk,
// css('--muted') -> theme.muted; FONT -> font; fillPanel now takes ctx.

import { defineCanvasTool } from "@/tools/registry";
import { fmtNum, fillPanel } from "@/canvas/drawHelpers";
import { PercAmountDialog } from "@/tools/percamount/Dialog";

export interface PercAmountParams {
  pct: number;
  whole: number;
  fill: boolean;
}

export const percAmountTool = defineCanvasTool<PercAmountParams>({
  kind: "canvas",
  type: "percamount",
  name: "Percentage of an amount",
  blurb: "e.g. 15% of 80",
  category: "fractions",

  defaults: () => ({ pct: 15, whole: 80, fill: false }),

  size: (p) => ({ w: 340, h: p.fill ? 156 : 60 }),

  draw: ({ ctx, theme, font }, o) => {
    const ans = (o.whole * o.pct) / 100,
      ten = o.whole / 10,
      one = o.whole / 100;
    ctx.save();
    fillPanel(ctx, o);
    const cy = o.y + 34;
    ctx.fillStyle = theme.lineInk;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "700 24px " + font;
    const head = fmtNum(o.pct) + "% of " + fmtNum(o.whole) + " =";
    ctx.fillText(head, o.x + 16, cy);
    ctx.fillText(
      o.fill ? fmtNum(ans) : "",
      o.x + 16 + ctx.measureText(head).width + 10,
      cy,
    );
    if (o.fill) {
      ctx.font = "600 17px " + font;
      ctx.fillStyle = theme.muted;
      let y = o.y + 74;
      ctx.fillText(
        "10% of " + fmtNum(o.whole) + " = " + fmtNum(ten) + "   (÷ 10)",
        o.x + 16,
        y,
      );
      y += 26;
      ctx.fillText(
        "1% of " + fmtNum(o.whole) + " = " + fmtNum(one) + "   (÷ 100)",
        o.x + 16,
        y,
      );
      y += 26;
      ctx.fillStyle = theme.lineInk;
      ctx.fillText(
        fmtNum(o.pct) + "% = " + fmtNum(one) + " × " + fmtNum(o.pct) + " = " + fmtNum(ans),
        o.x + 16,
        y,
      );
    }
    ctx.restore();
  },

  Dialog: PercAmountDialog,
});
