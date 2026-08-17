import { Platform, TextStyle } from "react-native";

// ── Jobba the Hunt — visual identity ────────────────────────────────────
// Deep-space blacks, holo-panel blues, and the crawl yellow (#FFE81F) that
// every Star Wars title card has opened with since 1977. Saber colours do
// the semantic work: blue = neutral, green = win, red = danger.

export const palette = {
  void: "#05060A", // deep space — app background
  panel: "#0E131C", // holo panel surface
  // Cards sit on the starfield, so their fill is deliberately translucent —
  // the stars have to keep drifting behind the content.
  panelTranslucent: "rgba(14,19,28,0.74)",
  panelAltTranslucent: "rgba(20,27,39,0.72)",
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

/**
 * Caps a modal sheet's width.
 *
 * On a phone a sheet filling the width is correct. In a browser window it
 * stretches a confirmation dialog across 1600px, which reads as a page
 * rather than a dialog — so each sheet gets a ceiling suited to its content.
 */
export function modalSheet(maxWidth: number) {
  return { width: "100%" as const, maxWidth, alignSelf: "center" as const };
}

/**
 * Caps the reading column on wide screens.
 *
 * On a phone this is a no-op. On a desktop browser the cards were stretching
 * to the full viewport, putting job descriptions at ~140 characters a line,
 * which is well past comfortable reading.
 */
export const contentColumn = {
  width: "100%" as const,
  maxWidth: 900,
  alignSelf: "center" as const,
};

// A holo panel: dark fill, lit edge, soft blue bloom underneath.
export const holoPanel = {
  backgroundColor: palette.panelTranslucent,
  borderWidth: 1,
  borderColor: palette.border,
  borderRadius: 4, // sharp-ish corners read more "cockpit console" than pill
  shadowColor: palette.saberBlue,
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
  elevation: 4,
};
