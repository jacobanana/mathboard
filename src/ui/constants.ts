// Shared UI constants for the options strip, ported verbatim from the
// prototype (maths-whiteboard.html lines 156-158).
//
//   PALETTE   -> pen / text colours, [label, hex] pairs.
//   PEN_SIZES -> pen thickness presets, [label, px] pairs.
//   TEXT_SIZES-> text size presets, [label, px] pairs. The glyph sizes
//                ([14,17,21]) mirror the prototype's "A" preview scaling.
//
// These are literal hex values from the prototype, NOT theme tokens (the
// prototype hard-codes them in PALETTE), so they stay as literals here.

export const PALETTE: [string, string][] = [
  ["black", "#1C2826"],
  ["blue", "#2E6FB7"],
  ["red", "#D64545"],
  ["green", "#2E9E5B"],
  ["orange", "#E8842B"],
];

export const PEN_SIZES: [string, number][] = [
  ["S", 3],
  ["M", 6],
  ["L", 12],
];

export const TEXT_SIZES: [string, number][] = [
  ["S", 18],
  ["M", 26],
  ["L", 40],
];

/** Glyph preview font sizes for the S/M/L text-size buttons. */
export const TEXT_SIZE_GLYPH = [14, 17, 21];
