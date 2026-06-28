// Single source of truth for design tokens.
// src/styles/index.css :root mirrors these exact hex values.
// Draw code reads colours from `theme` (passed in via DrawKit) instead of
// the prototype's css("--x") calls. Literal hex colours inside draw functions
// (e.g. "#fff", "#C3D4D2") stay as literals -- only css("--x") maps here.

export const theme = {
  paper: "#FBFAF7",
  grid: "#CBD8DA",
  bar: "#1E3A3A",
  ink: "#1C2826",
  accent: "#F2B33D",
  accentSoft: "#FBE6B5",
  textOnBar: "#EAF2F1",
  muted: "#7E9897",
  shade: "#F2B33D",
  lineInk: "#28403F",
  panel: "#FFFFFF",
} as const;

export type Theme = typeof theme;

// The prototype font stack (was --font). Exposed to draw code as kit.font.
export const fontFamily =
  "'Segoe UI Rounded', ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
