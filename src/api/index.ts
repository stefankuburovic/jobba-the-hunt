import { Job } from "../types";
import { fetchArbeitnowPage, RateLimitError } from "./arbeitnow";
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

export interface FeedRequest {
  /** Empty means "show me everything" — no keyword filtering at all. */
  search?: string;
  /** Greenhouse company slugs the user is targeting (Phase 4). */
  targets?: string[];
  cursor?: FeedCursor | null;
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
  cursor = null,
}: FeedRequest = {}): Promise<FeedResult> {
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
    const oneShot: Array<{ label: string; run: () => Promise<Job[]> }> = [
      { label: "Remotive", run: () => fetchRemotiveJobs(search) },
      { label: "Remote OK", run: fetchRemoteOkJobs },
      { label: "Jobicy", run: fetchJobicyJobs },
      { label: "We Work Remotely", run: fetchWeWorkRemotelyJobs },
      ...targets.map((slug) => ({
        label: slug,
        run: async () => {
          const found = await fetchGreenhouseJobs(slug);
          return filterJobs(found, keywords)
            .sort(byNewest)
            .slice(0, GREENHOUSE_CAP_PER_COMPANY);
        },
      })),
    ];

    const settled = await Promise.allSettled(oneShot.map((s) => s.run()));
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        // Greenhouse entries filtered themselves above (they also cap), so
        // re-filtering here is harmless and keeps boards consistent.
        jobs.push(...filterJobs(result.value, keywords));
      } else {
        const err = result.reason;
        note(
          err instanceof UnknownCompanyError ? `${err.slug} (unknown board)` : oneShot[i].label,
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

  const arbeitnowMaxPages = keywords
    ? ARBEITNOW_MAX_PAGES_SEARCHING
    : ARBEITNOW_MAX_PAGES_BROWSING;
  let arbeitnowFound = 0;

  for (let i = 0; i < arbeitnowMaxPages; i++) {
    if (i > 0) await delay(PAGE_DELAY_MS);
    try {
      const page = await fetchArbeitnowPage(arbeitnowPage, keywords);
      jobs.push(...page.jobs);
      arbeitnowFound += page.jobs.length;
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

  try {
    const page = await fetchMusePage(musePage);
    jobs.push(...filterJobs(page.jobs, keywords));
    museHasNext = page.hasNext;
    musePage += 1;
  } catch (err) {
    note("The Muse", err);
    museHasNext = false;
  }

  try {
    const found = await fetchHimalayasJobs(himalayasOffset);
    jobs.push(...filterJobs(found, keywords));
    himalayasHasNext = found.length === HIMALAYAS_PAGE_SIZE;
    himalayasOffset += HIMALAYAS_PAGE_SIZE;
  } catch (err) {
    note("Himalayas", err);
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
