import { Job } from "./types";

/**
 * A content key for spotting the same posting listed more than once.
 *
 * Measured on a live scan, repeats are mostly *within* one board rather
 * than across boards — a board carrying the same Coinbase role three times,
 * or the same Arbeitnow posting under two slugs. Those have different ids,
 * so id-based deduping never catches them.
 *
 * Normalising drops the decoration employers vary between copies: seniority
 * prefixes, remote markers, and the German gender suffixes (m/w/d) that
 * Arbeitnow postings carry.
 */
const NOISE =
  /\b(senior|sr|junior|jr|mid|lead|staff|principal|remote|hybrid|onsite|fulltime|full time|part time|contract|permanent|[mfwd](?:\s+[mfwd]){1,2}|all genders|gn)\b/g;

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ") // parenthesised asides: "(Remote)", "(m/w/d)"
    .replace(/[^a-z0-9]+/g, " ")
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function postingKey(job: Job): string {
  return `${normalise(job.company)}::${normalise(job.title)}`;
}

/**
 * Keeps the first occurrence of each posting. Callers sort before this, so
 * "first" means the freshest copy rather than an arbitrary one.
 */
export function dedupePostings(jobs: Job[], seen = new Set<string>()): Job[] {
  return jobs.filter((job) => {
    const key = postingKey(job);
    if (!key || key === "::" || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
