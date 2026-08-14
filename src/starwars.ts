/**
 * Spots Star Wars references inside a job posting.
 *
 * The naive version of this — one flat keyword list — lights up a huge
 * share of a real job board, because the franchise borrowed its vocabulary
 * from ordinary English. "Force" is in Salesforce and workforce, "Republic"
 * is in Czech Republic, "hunter" is in headhunter, "Empire" is a company
 * name, "solo" describes how you work. So terms are split in two:
 *
 *  - DISTINCTIVE: invented or rare enough to stand alone.
 *  - CONTEXTUAL: everyday words that only count inside a giveaway phrase.
 *
 * Everything is word-boundary matched, which is also what keeps "droid"
 * from firing on every Android posting.
 */

const DISTINCTIVE = [
  "jedi", "sith", "padawan", "lightsaber", "wookiee", "ewok", "yoda",
  "chewbacca", "skywalker", "kenobi", "obi-wan", "qui-gon", "palpatine",
  "darth", "vader", "mandalorian", "boba fett", "jango fett", "stormtrooper",
  "tatooine", "coruscant", "dagobah", "alderaan", "kashyyyk", "naboo",
  "endor", "hoth", "mustafar", "jakku", "kamino", "kyber", "holocron",
  "starkiller", "millennium falcon", "death star", "x-wing", "tie fighter",
  "star destroyer", "at-at", "bantha", "tauntaun", "sarlacc", "jabba",
  "grogu", "ahsoka", "thrawn", "admiral ackbar", "nerf herder", "womp rat",
  "droid", "droids", "astromech", "protocol droid", "lothal", "dantooine",
];

// Common words that need a giveaway phrase around them before they count.
const CONTEXTUAL = [
  "may the force",
  "force be with you",
  "the force is strong",
  "a long time ago in a galaxy",
  "galaxy far,? far away",
  "dark side of the force",
  "galactic empire",
  "rebel alliance",
  "the rebellion",
  "first order",
  "outer rim",
  "imperial fleet",
  "han solo",
  "princess leia",
  "general grievous",
  "clone wars",
  "these aren'?t the .{1,20} you'?re looking for",
  "i have a bad feeling about this",
  "do or do not",
];

function escape(term: string): string {
  // Only dots and dashes need escaping; the rest of the list is plain text
  // or intentional regex (the `,?` and `.{1,20}` above).
  return term.replace(/\./g, "\\.").replace(/-/g, "\\-");
}

const DISTINCTIVE_RE = new RegExp(
  `\\b(${DISTINCTIVE.map(escape).join("|")})\\b`,
  "i"
);
const CONTEXTUAL_RE = new RegExp(`(${CONTEXTUAL.join("|")})`, "i");

/**
 * Returns the matched phrase, or null. The phrase is returned rather than a
 * boolean so the card can show *what* it found — a badge reading "JEDI" is
 * the joke; a badge reading "STAR WARS" is not.
 */
export function findStarWarsReference(...parts: string[]): string | null {
  const haystack = parts.filter(Boolean).join(" \n ");

  const distinctive = DISTINCTIVE_RE.exec(haystack);
  if (distinctive) return distinctive[1];

  const contextual = CONTEXTUAL_RE.exec(haystack);
  if (contextual) return contextual[1];

  return null;
}

/** Trims a match down to something that fits on a badge. */
export function referenceBadge(match: string): string {
  const cleaned = match.replace(/\s+/g, " ").trim();
  return cleaned.length > 18 ? `${cleaned.slice(0, 17)}…` : cleaned;
}
