import { Platform, TextStyle } from "react-native";

// ── Jobba the Hunt — visual identity ────────────────────────────────────
// Deep-space blacks, holo-panel blues, and the crawl yellow (#FFE81F) that
// every Star Wars title card has opened with since 1977. Saber colours do
// the semantic work: blue = neutral, green = win, red = danger.

export const palette = {
  void: "#05060A", // deep space — app background
  panel: "#0E131C", // holo panel surface
  panelAlt: "#141B27", // raised surface (chips, inputs)
  border: "#22304A", // panel edge
  borderBright: "#3A5580",

  crawl: "#FFE81F", // the opening-crawl yellow
  saberBlue: "#4FC3F7",
  saberGreen: "#4ADE80",
  saberRed: "#FF4D4D",
  saberPurple: "#A78BFA",
  carbonite: "#8494AC", // frozen-out grey

  text: "#E8EDF5",
  textDim: "#94A3B8",
  textFaint: "#64748B",
} as const;

// No custom font file ships with the app, so we lean on the condensed system
// faces — uppercase + wide letter-spacing is what actually reads as "Star
// Wars" on screen, not the typeface alone.
export const fontFamily = Platform.select({
  ios: "Avenir Next Condensed",
  android: "sans-serif-condensed",
  default: "System",
});

export const type = {
  // Title-card lettering: the app name, screen headers.
  display: {
    fontFamily,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  } as TextStyle,
  // Small all-caps labels: badges, chips, buttons.
  label: {
    fontFamily,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  } as TextStyle,
  // Readable body copy — no transform, normal spacing.
  body: {
    fontFamily,
    letterSpacing: 0.2,
  } as TextStyle,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// A holo panel: dark fill, lit edge, soft blue bloom underneath.
export const holoPanel = {
  backgroundColor: palette.panel,
  borderWidth: 1,
  borderColor: palette.border,
  borderRadius: 4, // sharp-ish corners read more "cockpit console" than pill
  shadowColor: palette.saberBlue,
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
  elevation: 4,
};
