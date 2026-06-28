// REFERENCE TOOL (canvas, NO dialog). The free-text tool.
//
// Unlike numberline, text has no modal: an object is created by clicking the
// board with the text tool, and edited in place via a <textarea> overlay the
// canvas manages. So there is no Dialog here.
//
// EDITING CONVENTION (read this if you build the canvas/editor):
//   The store holds `editingId` (ephemeral). While a text object is being
//   typed, the canvas sets editingId to that object's id, hides it from its own
//   render pass, and shows the textarea over it. This tool's draw() ALSO no-ops
//   when the object is the one being edited -- the canvas passes that fact by
//   simply not calling draw for the editing object, but draw guards defensively
//   on an `editing` flag too. On commit the canvas clears editingId, recomputes
//   size via textSizeOf, and writes back through updateObject (or removeObject
//   if the text is empty).
//
// Ported from drawText (maths-whiteboard.html line 229) and textSizeOf.

import { defineCanvasTool } from "@/tools/registry";
import { textSizeOf } from "@/canvas/drawHelpers";
import { theme } from "@/styles/theme";

export interface TextParams {
  text: string;
  size: number;
  color: string;
}

export const textTool = defineCanvasTool<TextParams>({
  kind: "canvas",
  type: "text",
  name: "Text",
  blurb: "type anywhere",
  category: "word",
  inGallery: false, // created by clicking with the text tool, not the gallery.

  defaults: () => ({ text: "", size: 26, color: theme.ink }),

  size: (p) => textSizeOf(p.text, p.size),

  draw: ({ ctx, font }, o) => {
    // Defensive guard: never paint the object the canvas is actively editing.
    if ((o as { editing?: boolean }).editing) return;
    ctx.save();
    ctx.fillStyle = o.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "500 " + o.size + "px " + font;
    const lh = o.size * 1.3;
    (o.text || "").split("\n").forEach((ln, i) => {
      ctx.fillText(ln, o.x, o.y + i * lh);
    });
    ctx.restore();
  },
});
