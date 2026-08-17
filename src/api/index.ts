import { Platform } from "react-native";
import { AggregatorSource, Job } from "../types";
import { fetchArbeitnowPage, RateLimitError } from "./arbeitnow";
import { withoutExcludedIndustries } from "./excluded";
import { fetchGreenhouseJobs, UnknownCompanyError } from "./greenhouse";
import { fetchHimalayasJobs, HIMALAYAS_PAGE_SIZE } from "./himalayas";
import { fetchJobicyJobs } from "./jobicy";
import { fetchMusePage } from "./themuse";
import { fetchRemoteOkJobs } from "./remoteok";
import { fetchRemotiveJobs } from "./remotive";
import { fetchWeWorkRemotelyJobs } from "./weworkremotely";
import { isNetworkError, matchesKeywords, searchKeywords } from "./util";

/** Opaque position in the feed, handed back to ask for the next batch. */
export interface FeedCursor {
  arbeitnowPage: number;
  musePage: number;
  himalayasOffset: number;
}

/** A source answering, reported as it lands so the UI can narrate the scan. */
export interface ScanEvent {
  label: string;
  count: number;
  ok: boolean;
}

/** Every toggleable source, including Greenhouse as one combined entry. */
export type SourceFilter = AggregatorSource | "greenhouse";

/**
 * Sources a browser cannot reach.
 *
 * Every other board sends `Access-Control-Allow-Origin: *`; Himalayas sends
 * no CORS header at all, so the browser blocks the response before our code
 * sees it. Rather than surface that as a mystery outage, the web build
 * doesn't offer it — proxying it would mean running a backend, which this
 * project deliberately doesn't have.
 */
export const CORS_BLOCKED_SOURCES: SourceFilter[] = ["himalayas"];

export function isSourceAvailable(source: SourceFilter): boolean {
  return Platform.OS !== "web" || !CORS_BLOCKED_SOURCES.includes(source);
}

const EVERY_SOURCE: SourceFilter[] = [
  "remotive",
  "arbeitnow",
  "remoteok",
  "jobicy",
  "themuse",
  "himalayas",
  "weworkremotely",
  "greenhouse",
];

export const ALL_SOURCE_FILTERS: SourceFilter[] = EVERY_SOURCE.filter(
  isSourceAvailable
);

export interface FeedRequest {
  /** Empty means "show me everything" — no keyword filtering at all. */
  search?: string;
  /** Greenhouse company slugs the user is targeting (Phase 4). */
  targets?: string[];
  /** Which sources to actually contact; omitted means all of them. */
  sources?: SourceFilter[];
  cursor?: FeedCursor | null;
  /**
   * Fires as each source answers. The boards are queried in parallel — doing
   * it sequentially would make a load eight times longer — so these arrive
   * in the order the sources respond, not the order they were called.
   */
  onProgress?: (event: ScanEvent) => void;
}

export interface FeedResult {
  jobs: Job[];
  /** null once every source is exhausted. */
  cursor: FeedCursor | null;
  failedSources: string[];
  /** A board asked us to slow down; the cursor is still good to retry. */
  rateLimited: boolean;
  /** The device couldn't reach the network at all — not a source outage. */
  offline: boolean;
}

// Unfiltered, one Arbeitnow page is already 100 postings, so a single
// request is plenty. Filtering is what makes pages sparse — a page of 100
// can yield one hit — so a keyword search is allowed to walk further.
const ARBEITNOW_MAX_PAGES_BROWSING = 1;
const ARBEITNOW_MAX_PAGES_SEARCHING = 3;
const ARBEITNOW_SEARCH_TARGET = 10;
const PAGE_DELAY_MS = 600;
// A single Greenhouse board can carry 500+ roles; unfiltered, one employer
// would drown out every board in the feed.
const GREENHOUSE_CAP_PER_COMPANY = 60;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function byNewest(a: Job, b: Job): number {
  return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
}

function filterJobs(jobs: Job[], keywords: string[] | null): Job[] {
  jobs = withoutExcludedIndustries(jobs);
  if (!keywords) return jobs;
  // The description is searched too: a "react" role is often titled
  // "Software Engineer", and matching titles alone hides most of them.
  return jobs.filter((j) =>
    matchesKeywords(
      `${j.title} ${j.tags.join(" ")} ${j.company} ${j.description}`,
      keywords
    )
  );
}

/**
 * Fetches one batch of the merged feed.
 *
 * The sources disagree about paging. Arbeitnow (`?page=`), The Muse
 * (`?page=`) and Himalayas (`?offset=`) walk; Remotive, Remote OK, Jobicy,
 * We Work Remotely and Greenhouse hand over their whole listing at once. So
 * the one-shot sources contribute to the first batch only, and later
 * batches advance the three that page.
 */
export async function fetchFeedPage({
  search = "",
  targets = [],
  sources = ALL_SOURCE_FILTERS,
  cursor = null,
  onProgress,
}: FeedRequest = {}): Promise<FeedResult> {
  const enabled = (id: SourceFilter) =>
    sources.includes(id) && isSourceAvailable(id);
  const report = (label: string, count: number, ok: boolean) =>
    onProgress?.({ label, count, ok });
  const isFirstBatch = cursor === null;
  // An empty box is a deliberate "browse everything", not a reason to fall
  // back to a hardcoded frontend filter.
  const keywords = search.trim() ? searchKeywords(search) : null;

  const failedSources: string[] = [];
  const jobs: Job[] = [];
  let offline = false;
  let rateLimited = false;

  const note = (label: string, err: unknown) => {
    if (isNetworkError(err)) offline = true;
    failedSources.push(label);
  };

  if (isFirstBatch) {
    const oneShot: Array<{ label: string; run: () => Promise<Job[]> }> = [];

    if (enabled("remotive")) {
      oneShot.push({ label: "Remotive", run: () => fetchRemotiveJobs(search) });
    }
    if (enabled("remoteok")) {
      oneShot.push({ label: "Remote OK", run: fetchRemoteOkJobs });
    }
    if (enabled("jobicy")) {
      oneShot.push({ label: "Jobicy", run: fetchJobicyJobs });
    }
    if (enabled("weworkremotely")) {
      oneShot.push({ label: "We Work Remotely", run: fetchWeWorkRemotelyJobs });
    }
    if (enabled("greenhouse")) {
      for (const slug of targets) {
        oneShot.push({
          label: slug,
          run: async () => {
            const found = await fetchGreenhouseJobs(slug);
            return filterJobs(found, keywords)
              .sort(byNewest)
              .slice(0, GREENHOUSE_CAP_PER_COMPANY);
          },
        });
      }
    }

    // Reported as each one lands, not as each is started: they all start at
    // the same instant, so start events would arrive as one useless burst.
    const settled = await Promise.allSettled(
      oneShot.map(async (source) => {
        try {
          const found = filterJobs(await source.run(), keywords);
          report(source.label, found.length, true);
          return found;
        } catch (err) {
          report(source.label, 0, false);
          throw err;
        }
      })
    );

    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        jobs.push(...result.value);
      } else {
        const err = result.reason;
        note(
          err instanceof UnknownCompanyError
            ? `${err.slug} (unknown board)`
            : oneShot[i].label,
          err
        );
      }
    });
  }

  // ── Paging sources ────────────────────────────────────────────────────
  let arbeitnowPage = cursor?.arbeitnowPage ?? 1;
  let musePage = cursor?.musePage ?? 0;
  let himalayasOffset = cursor?.himalayasOffset ?? 0;
  let arbeitnowHasNext = true;
  let museHasNext = true;
  let himalayasHasNext = true;

  const arbeitnowMaxPages = !enabled("arbeitnow")
    ? 0
    : keywords
    ? ARBEITNOW_MAX_PAGES_SEARCHING
    : ARBEITNOW_MAX_PAGES_BROWSING;
  let arbeitnowFound = 0;

  for (let i = 0; i < arbeitnowMaxPages; i++) {
    if (i > 0) await delay(PAGE_DELAY_MS);
    try {
      const page = await fetchArbeitnowPage(arbeitnowPage, keywords);
      const kept = withoutExcludedIndustries(page.jobs);
      jobs.push(...kept);
      arbeitnowFound += kept.length;
      arbeitnowHasNext = page.hasNext;
      arbeitnowPage += 1;
      if (!arbeitnowHasNext || arbeitnowFound >= ARBEITNOW_SEARCH_TARGET) break;
    } catch (err) {
      if (err instanceof RateLimitError) {
        // Hold the page number: the cursor stays valid so the next scroll
        // resumes exactly where we stopped.
        rateLimited = true;
      } else {
        note("Arbeitnow", err);
        arbeitnowHasNext = false;
      }
      break;
    }
  }

  if (enabled("arbeitnow")) report("Arbeitnow", arbeitnowFound, arbeitnowHasNext);
  else arbeitnowHasNext = false;

  if (enabled("themuse")) {
    try {
      const page = await fetchMusePage(musePage);
      const kept = filterJobs(page.jobs, keywords);
      jobs.push(...kept);
      museHasNext = page.hasNext;
      musePage += 1;
      report("The Muse", kept.length, true);
    } catch (err) {
      note("The Muse", err);
      report("The Muse", 0, false);
      museHasNext = false;
    }
  } else {
    museHasNext = false;
  }

  if (enabled("himalayas")) {
    try {
      const found = await fetchHimalayasJobs(himalayasOffset);
      const kept = filterJobs(found, keywords);
      jobs.push(...kept);
      himalayasHasNext = found.length === HIMALAYAS_PAGE_SIZE;
      himalayasOffset += HIMALAYAS_PAGE_SIZE;
      report("Himalayas", kept.length, true);
    } catch (err) {
      note("Himalayas", err);
      report("Himalayas", 0, false);
      himalayasHasNext = false;
    }
  } else {
    himalayasHasNext = false;
  }

  jobs.sort(byNewest);

  const hasNext = arbeitnowHasNext || museHasNext || himalayasHasNext;

  return {
    jobs,
    cursor: hasNext ? { arbeitnowPage, musePage, himalayasOffset } : null,
    failedSources,
    rateLimited,
    offline,
  };
}
