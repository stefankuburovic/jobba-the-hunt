// Very small HTML → text stripper. Job description APIs return HTML;
// we only need readable plain text for a card/detail view.
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li>/gi, "\n• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
