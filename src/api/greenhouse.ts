import { Job } from "../types";
import { stripHtml } from "./util";

// Public, read-only board API: boards-api.greenhouse.io
// This is the Phase 4 source — not a job board but a per-employer feed, so
// you point it at the companies you're actually targeting. `content=true`
// includes the full posting; it arrives HTML-escaped.
const BASE_URL = "https://boards-api.greenhouse.io/v1/boards";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  content?: string;
  company_name?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
}

/** Thrown when a slug doesn't exist, so the UI can say which one is wrong. */
export class UnknownCompanyError extends Error {
  constructor(public readonly slug: string) {
    super(`No Greenhouse board for "${slug}"`);
    this.name = "UnknownCompanyError";
  }
}

export async function fetchGreenhouseJobs(slug: string): Promise<Job[]> {
  const res = await fetch(
    `${BASE_URL}/${encodeURIComponent(slug)}/jobs?content=true`
  );

  if (res.status === 404) {
    throw new UnknownCompanyError(slug);
  }
  if (!res.ok) {
    throw new Error(`Greenhouse error for ${slug}: ${res.status}`);
  }

  const data: { jobs?: GreenhouseJob[] } = await res.json();

  return (data.jobs ?? []).map((j) => {
    const location = j.location?.name;
    return {
      id: `greenhouse:${slug}:${j.id}`,
      source: `greenhouse:${slug}` as const,
      title: j.title,
      company: j.company_name || slug,
      url: j.absolute_url,
      description: stripHtml(j.content ?? ""),
      tags: (j.departments ?? [])
        .map((d) => d.name)
        .filter((n): n is string => Boolean(n)),
      remote: /remote/i.test(`${location ?? ""} ${j.title}`),
      location,
      postedDate: j.first_published ?? j.updated_at ?? new Date().toISOString(),
    };
  });
}
