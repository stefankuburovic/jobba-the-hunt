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
}

export async function fetchArbeitnowJobs(): Promise<Job[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    throw new Error(`Arbeitnow API error: ${res.status}`);
  }
  const data: ArbeitnowResponse = await res.json();

  // Arbeitnow's API has no server-side keyword search, so we filter client-side.
  const filtered = data.data.filter((j) =>
    matchesKeywords(`${j.title} ${j.tags.join(" ")}`)
  );

  return filtered.map((j) => ({
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
  }));
}
