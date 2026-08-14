import { Job } from "../types";

/**
 * Drops gambling and adult-industry postings from the feed.
 *
 * The trap here is bigger than it looks. Almost every job description ends
 * with an equal-opportunity statement — "regardless of race, sex, gender
 * identity, sexual orientation…" — so a bare "sex" or "sexual" would filter
 * out practically the entire board. Likewise "gaming" is the video-game
 * industry, "adult" is adult education and adult social care, "slots" are
 * calendar slots, "stake" is in stakeholder, and "bet" is inside "between".
 *
 * So, as with the Star Wars detector: unambiguous words stand alone, and
 * everyday words only count inside a phrase that pins the meaning down.
 */

const GAMBLING = [
  "gambling", "casino", "casinos", "croupier", "sportsbook", "igaming",
  "bookmaker", "betting", "bettors?", "wagering", "poker", "roulette",
  "blackjack", "baccarat", "lotter(?:y|ies)", "scratchcard",
  "slot machines?", "sports ?betting", "online gambling", "betting shop",
  "bet365", "pokerstars", "draftkings", "fanduel", "unibet", "betsson",
  "williamhill", "william hill", "paddy power", "gambling licen[cs]e",
];

const ADULT = [
  "pornograph(?:y|ic)", "\\bporn\\b", "camgirls?", "onlyfans", "brothel",
  "strippers?", "strip club", "erotica?", "hentai", "fetish",
  "adult entertainment", "adult content", "adult industry", "adult film",
  "adult video", "adult site", "adult website", "webcam models?",
  "cam models?", "sex work(?:er)?s?", "sexually explicit", "sex toys?",
  "escort agency", "escort service",
];

const EXCLUDED_RE = new RegExp(`\\b(?:${[...GAMBLING, ...ADULT].join("|")})`, "i");

/**
 * True when a posting is from one of the excluded industries.
 *
 * Company and tags are weighted the same as the title, since these
 * employers usually name themselves plainly ("Casino X", "Betting Y") even
 * when the role itself is an ordinary engineering job.
 */
export function isExcludedIndustry(job: Job): boolean {
  return EXCLUDED_RE.test(
    `${job.title} ${job.company} ${job.tags.join(" ")} ${job.description}`
  );
}

export function withoutExcludedIndustries(jobs: Job[]): Job[] {
  return jobs.filter((job) => !isExcludedIndustry(job));
}
