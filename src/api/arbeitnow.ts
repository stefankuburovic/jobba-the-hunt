import { Job } from "../types";
import { matchesKeywords, stripHtml } from "./util";

// Public, key-free, ToS-friendly: https://arbeitnow.com/api/job-board-api
const BASE_URL = "https://www.arbeitnow.com/api/job-board-api";

interface ArbeitnowApiJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number; // unix seconds
}

interface ArbeitnowResponse {
  data: ArbeitnowApiJob[];
  links: { next: string | null };
  meta: { current_page: number };
}

/** The board is free and asks not to be hammered; it answers 429 when we do. */
export class RateLimitError extends Error {
  constructor() {
    super("Arbeitnow rate limit");
    this.name = "RateLimitError";
  }
}

export interface ArbeitnowPage {
  jobs: Job[];
  /** How many postings the page held before keyword filtering. */
  scanned: number;
  hasNext: boolean;
}

/**
 * Fetches one page (100 postings) of the Arbeitnow board.
 *
 * The API has no server-side keyword search, so filtering happens here —
 * which means a page of 100 can yield very few matches. Callers that need a
 * usable batch should keep pulling pages; `hasNext` says when to stop.
 */
export async function fetchArbeitnowPage(
  page = 1,
  keywords?: string[]
): Promise<ArbeitnowPage> {
  const res = await fetch(`${BASE_URL}?page=${page}`);

  // 429 means "slow down", not "this source is broken" — the caller has to
  // keep its cursor and let the user retry rather than ending the feed.
  if (res.status === 429) {
    throw new RateLimitError();
  }
  if (!res.ok) {
    throw new Error(`Arbeitnow API error: ${res.status}`);
  }
  const data: ArbeitnowResponse = await res.json();
  const postings = data.data ?? [];

  const filtered = postings.filter((j) =>
    matchesKeywords(`${j.title} ${j.tags.join(" ")}`, keywords)
  );

  return {
    jobs: filtered.map((j) => ({
      id: `arbeitnow:${j.slug}`,
      source: "arbeitnow" as const,
      title: j.title,
      company: j.company_name,
      url: j.url,
      description: stripHtml(j.description ?? ""),
      tags: j.tags ?? [],
      remote: j.remote,
      location: j.location,
      postedDate: new Date(j.created_at * 1000).toISOString(),
    })),
    scanned: postings.length,
    hasNext: Boolean(data.links?.next),
  };
}
