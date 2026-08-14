import { Job } from "../types";
import { stripHtml } from "./util";

// Public JSON, no key: https://jobicy.com/api/v2/remote-jobs
// `count` caps at 50 and there is no offset parameter, so this is a
// one-shot source: it contributes to the first batch only.
const BASE_URL = "https://jobicy.com/api/v2/remote-jobs";
const MAX_COUNT = 50;

interface JobicyJob {
  id: number | string;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string[] | string;
  jobType?: string[] | string;
  jobGeo?: string;
  jobLevel?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
  salaryMin?: number | string;
  salaryMax?: number | string;
  salaryCurrency?: string;
}

function toArray(value: string[] | string | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: number | string | undefined): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function fetchJobicyJobs(): Promise<Job[]> {
  const res = await fetch(`${BASE_URL}?count=${MAX_COUNT}`);
  if (!res.ok) {
    throw new Error(`Jobicy API error: ${res.status}`);
  }

  const data: { jobs?: JobicyJob[] } = await res.json();

  return (data.jobs ?? []).map((j) => ({
    id: `jobicy:${j.id}`,
    source: "jobicy" as const,
    title: j.jobTitle,
    company: j.companyName,
    url: j.url,
    description: stripHtml(j.jobDescription || j.jobExcerpt || ""),
    tags: [...toArray(j.jobIndustry), ...toArray(j.jobType)].filter(Boolean),
    remote: true,
    location: j.jobGeo || "Remote",
    // Jobicy sends an RFC-ish date string; normalise or fall back to now so
    // the feed never sorts on NaN.
    postedDate: j.pubDate
      ? new Date(j.pubDate).toISOString()
      : new Date().toISOString(),
    salaryMin: toNumber(j.salaryMin),
    salaryMax: toNumber(j.salaryMax),
    salaryCurrency: j.salaryCurrency || undefined,
  }));
}
