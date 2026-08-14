import { Job } from "../types";
import { stripHtml } from "./util";

// Public JSON, no key: https://himalayas.app/jobs/api
// The endpoint caps a page at 20 regardless of a larger `limit`, but it does
// honour `offset`, so it paginates.
const BASE_URL = "https://himalayas.app/jobs/api";
export const HIMALAYAS_PAGE_SIZE = 20;

interface HimalayasJob {
  guid: string;
  title: string;
  companyName: string;
  applicationLink?: string;
  description?: string;
  excerpt?: string;
  pubDate?: number; // unix seconds
  categories?: string[];
  employmentType?: string;
  locationRestrictions?: string[];
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
}

export async function fetchHimalayasJobs(offset = 0): Promise<Job[]> {
  const res = await fetch(
    `${BASE_URL}?limit=${HIMALAYAS_PAGE_SIZE}&offset=${offset}`
  );
  if (!res.ok) {
    throw new Error(`Himalayas API error: ${res.status}`);
  }

  const data: { jobs?: HimalayasJob[] } = await res.json();

  return (data.jobs ?? []).map((j) => ({
    id: `himalayas:${j.guid}`,
    source: "himalayas" as const,
    title: j.title,
    company: j.companyName,
    url: j.applicationLink || j.guid,
    description: stripHtml(j.description || j.excerpt || ""),
    tags: [...(j.categories ?? []), j.employmentType].filter(
      (t): t is string => Boolean(t)
    ),
    remote: true,
    location: j.locationRestrictions?.join(", ") || "Remote",
    postedDate: new Date((j.pubDate ?? 0) * 1000).toISOString(),
    salaryMin: j.minSalary || undefined,
    salaryMax: j.maxSalary || undefined,
    salaryCurrency: j.currency || undefined,
  }));
}
