import { Job } from "../types";
import { stripHtml } from "./util";

// Public JSON, no key: https://remoteok.com/api
//
// Their API terms require linking back to the Remote OK URL and naming
// Remote OK as the source. So `url` deliberately points at the Remote OK
// posting rather than `apply_url` (the employer's own page) — sending users
// straight past them is exactly what the terms forbid. Their logo is a
// registered trademark and is never used; the name is.
const BASE_URL = "https://remoteok.com/api";

interface RemoteOkJob {
  slug?: string;
  id?: string;
  epoch?: number;
  date?: string;
  company?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  url?: string;
  apply_url?: string;
}

export async function fetchRemoteOkJobs(): Promise<Job[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    throw new Error(`Remote OK API error: ${res.status}`);
  }

  const payload = await res.json();
  if (!Array.isArray(payload)) return [];

  // The first element is a legal/metadata object, not a posting — it has no
  // `id`, which is what distinguishes it.
  const postings = payload.filter(
    (entry): entry is RemoteOkJob => Boolean(entry) && Boolean(entry.id)
  );

  return postings.map((j) => ({
    id: `remoteok:${j.id}`,
    source: "remoteok" as const,
    title: j.position ?? "Untitled role",
    company: j.company ?? "Unknown",
    url: j.url ?? `https://remoteok.com/remote-jobs/${j.slug ?? j.id}`,
    description: stripHtml(j.description ?? ""),
    tags: j.tags ?? [],
    remote: true,
    location: j.location || "Remote",
    postedDate: j.date ?? new Date((j.epoch ?? 0) * 1000).toISOString(),
    salaryMin: j.salary_min || undefined,
    salaryMax: j.salary_max || undefined,
    salaryCurrency: j.salary_min ? "USD" : undefined,
  }));
}
