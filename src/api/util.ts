// Decodes HTML entities. `&amp;` goes LAST on purpose: decoding it first
// would turn `&amp;lt;` into `&lt;` and then into `<`, silently un-escaping
// text that was meant to stay literal.
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#0*39);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&amp;/gi, "&");
}

// Turns block-level markup into line breaks, then drops every remaining tag.
function stripTags(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, "");
}

/**
 * HTML → readable plain text.
 *
 * The sources disagree about escaping: Remotive sends real HTML, while
 * Arbeitnow sends it escaped (`&lt;p&gt;`) and sometimes double-escaped
 * (`&amp;quot;`). So decoding has to happen BEFORE tags are stripped —
 * otherwise the strip pass finds nothing to remove and the later decode
 * resurrects the markup as visible text. Repeating until the output stops
 * changing handles the double-escaped case; the cap keeps it bounded.
 */
export function stripHtml(html: string): string {
  let text = html;

  for (let pass = 0; pass < 3; pass++) {
    const next = stripTags(decodeEntities(text));
    if (next === text) break;
    text = next;
  }

  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

// Frontend-relevant keyword filter shared by both API clients.
export const DEFAULT_KEYWORDS = [
  "react",
  "angular",
  "typescript",
  "frontend",
  "front-end",
  "front end",
  "javascript",
  "next.js",
  "nextjs",
];

export function matchesKeywords(
  haystack: string,
  keywords: string[] = DEFAULT_KEYWORDS
): boolean {
  const lower = haystack.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

/**
 * Turns the search box into the keyword list used for client-side filtering.
 *
 * Remotive applies `search` server-side, but Arbeitnow has no search
 * parameter — so without this the two sources answered different questions:
 * typing "python" returned Python roles from Remotive and React roles from
 * Arbeitnow. An empty box falls back to the frontend defaults.
 */
export function searchKeywords(search: string): string[] {
  const terms = search
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  return terms.length > 0 ? terms : DEFAULT_KEYWORDS;
}
