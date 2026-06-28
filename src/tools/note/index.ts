// CanvasTool (canvas + dialog) — the "Problem card" / word-problem note.
//
// Ported from maths-whiteboard.html:
//   size:   line 219  (objSize case 'note' -> noteSize(p.text))
//   draw:   line 289  (drawNote)
//   dialog: lines 571-576 (noteDialog) -> ./Dialog.tsx
//
// draw() renders in world space (camera transform already applied). Literal hex
// from the prototype stays literal; css('--x') tokens map to theme tokens.

import { defineCanvasTool } from "@/tools/registry";
import { roundRect, wrapText, noteSize } from "@/canvas/drawHelpers";
import { NoteDialog } from "@/tools/note/Dialog";

export interface NoteParams {
  text: string;
}

export default defineCanvasTool<NoteParams>({
  kind: "canvas",
  type: "note",
  name: "Problem card",
  blurb: "type the question",
  category: "word",

  defaults: () => ({ text: "" }),

  size: (p) => noteSize(p.text),

  draw: ({ ctx, theme, font }, o) => {
    const padX = 18;
    const padY = 18;
    const noteFont = "500 17px " + font;
    const lh = 24;
    const maxW = o.w - padX * 2 - 10;
    const lines = wrapText(ctx, o.text || "", maxW, noteFont);
    ctx.save();
    ctx.fillStyle = "#FFFDF6";
    ctx.strokeStyle = "#E4D9B8";
    ctx.lineWidth = 1.5;
    roundRect(ctx, o.x, o.y, o.w, o.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    roundRect(ctx, o.x, o.y, 7, o.h, { tl: 12, bl: 12, tr: 0, br: 0 });
    ctx.fill();
    ctx.fillStyle = theme.muted;
    ctx.font = "700 11px " + font;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("WORD PROBLEM", o.x + padX, o.y + padY - 2);
    ctx.fillStyle = theme.ink;
    ctx.font = noteFont;
    lines.forEach((ln, i) =>
      ctx.fillText(ln, o.x + padX, o.y + padY + 22 + i * lh),
    );
    ctx.restore();
  },

  Dialog: NoteDialog,
});
