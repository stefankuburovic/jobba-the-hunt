import { Job } from "../types";
import { stripHtml } from "./util";

// Public JSON: https://www.themuse.com/api/public/jobs
// Pages are `?page=N` (0-indexed) at 20 results each. Unlike the remote
// boards this one is not remote-only, so `remote` is inferred from the
// location strings rather than assumed.
const BASE_URL = "https://www.themuse.com/api/public/jobs";

interface MuseJob {
  id: number;
  name: string;
  contents?: string;
  publication_date?: string;
  short_name?: string;
  company?: { name?: string };
  refs?: { landing_page?: string };
  locations?: Array<{ name?: string }>;
  categories?: Array<{ name?: string }>;
  levels?: Array<{ name?: string }>;
}

export interface MusePage {
  jobs: Job[];
  hasNext: boolean;
}

export async function fetchMusePage(page = 0): Promise<MusePage> {
  const res = await fetch(`${BASE_URL}?page=${page}`);
  if (!res.ok) {
    throw new Error(`The Muse API error: ${res.status}`);
  }

  const data: { results?: MuseJob[]; page_count?: number } = await res.json();
  const results = data.results ?? [];

  const jobs = results.map((j) => {
    const location = (j.locations ?? [])
      .map((l) => l.name)
      .filter(Boolean)
      .join(", ");

    return {
      id: `themuse:${j.id}`,
      source: "themuse" as const,
      title: j.name,
      company: j.company?.name ?? "Unknown",
      url: j.refs?.landing_page ?? `https://www.themuse.com/jobs/${j.id}`,
      description: stripHtml(j.contents ?? ""),
      tags: [
        ...(j.categories ?? []).map((c) => c.name),
        ...(j.levels ?? []).map((l) => l.name),
      ].filter((t): t is string => Boolean(t)),
      remote: /remote|flexible/i.test(location),
      location: location || undefined,
      postedDate: j.publication_date
        ? new Date(j.publication_date).toISOString()
        : new Date().toISOString(),
    };
  });

  return {
    jobs,
    hasNext: typeof data.page_count === "number" ? page + 1 < data.page_count : false,
  };
}
