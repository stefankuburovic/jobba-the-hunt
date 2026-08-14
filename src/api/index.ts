import { Job } from "../types";
import { fetchArbeitnowPage, RateLimitError } from "./arbeitnow";
import { fetchRemotiveJobs } from "./remotive";
import { isNetworkError, searchKeywords } from "./util";

/** Opaque position in the feed, handed back to ask for the next batch. */
export interface FeedCursor {
  arbeitnowPage: number;
}

export interface FeedResult {
  jobs: Job[];
  /** null once every source is exhausted. */
  cursor: FeedCursor | null;
  failedSources: string[];
  /** The board asked us to slow down; the cursor is still good to retry. */
  rateLimited: boolean;
  /** The device couldn't reach the network at all — not a source outage. */
  offline: boolean;
}

// How many fresh matches make a batch worth showing, and how many Arbeitnow
// pages we'll burn chasing them. Arbeitnow filtering is client-side, so a
// page of 100 postings can yield two hits — without the loop the list would
// stall on an apparently-empty "load more".
const TARGET_BATCH = 12;
const MAX_PAGES_PER_BATCH = 3;
// Arbeitnow is a free board that asks not to be abused, and it starts
// answering 429 after a handful of back-to-back requests. Spacing the page
// walk keeps a batch under two seconds while staying a polite client.
const PAGE_DELAY_MS = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches one batch of the merged feed.
 *
 * The two sources paginate very differently: Arbeitnow exposes real
 * `?page=N` paging, while Remotive returns its whole result set in one
 * response with no offset parameter. So Remotive is pulled once for the
 * first batch, and later batches walk Arbeitnow only.
 *
 * Jobs are sorted within a batch but batches are appended in order rather
 * than re-sorted globally — otherwise a newly loaded page would reshuffle
 * rows the user has already scrolled past.
 */
export async function fetchFeedPage(
  search = "frontend",
  cursor: FeedCursor | null = null
): Promise<FeedResult> {
  const isFirstBatch = cursor === null;
  const keywords = searchKeywords(search);
  const failedSources: string[] = [];
  const jobs: Job[] = [];
  let offline = false;

  if (isFirstBatch) {
    try {
      jobs.push(...(await fetchRemotiveJobs(search)));
    } catch (err) {
      if (isNetworkError(err)) offline = true;
      failedSources.push("Remotive");
    }
  }

  let page = cursor?.arbeitnowPage ?? 1;
  let hasNext = true;
  let arbeitnowFailed = false;
  let rateLimited = false;
  const before = jobs.length;

  for (let i = 0; i < MAX_PAGES_PER_BATCH; i++) {
    if (i > 0) await delay(PAGE_DELAY_MS);

    try {
      const result = await fetchArbeitnowPage(page, keywords);
      jobs.push(...result.jobs);
      hasNext = result.hasNext;
      page += 1;
      if (!hasNext || jobs.length - before >= TARGET_BATCH) break;
    } catch (err) {
      if (err instanceof RateLimitError) {
        // Keep `hasNext` true and don't advance the page: the cursor stays
        // valid so the next scroll resumes exactly where we stopped.
        rateLimited = true;
      } else {
        if (isNetworkError(err)) offline = true;
        arbeitnowFailed = true;
        hasNext = false;
      }
      break;
    }
  }

  if (arbeitnowFailed) failedSources.push("Arbeitnow");

  jobs.sort(
    (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
  );

  return {
    jobs,
    cursor: hasNext ? { arbeitnowPage: page } : null,
    failedSources,
    rateLimited,
    offline,
  };
}
