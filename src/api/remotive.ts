import { Job } from "../types";
import { stripHtml } from "./util";

// Public, key-free, ToS-friendly: https://remotive.com/api/remote-jobs
// `search` is applied server-side, so we already only pull relevant postings.
const BASE_URL = "https://remotive.com/api/remote-jobs";

interface RemotiveApiJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary?: string;
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveApiJob[];
}

export async function fetchRemotiveJobs(search = "frontend"): Promise<Job[]> {
  const url = `${BASE_URL}?category=software-dev&search=${encodeURIComponent(search)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Remotive API error: ${res.status}`);
  }
  const data: RemotiveResponse = await res.json();

  return data.jobs.map((j) => ({
    id: `remotive:${j.id}`,
    source: "remotive" as const,
    title: j.title,
    company: j.company_name,
    url: j.url,
    description: stripHtml(j.description ?? ""),
    tags: j.tags ?? [],
    remote: true,
    location: j.candidate_required_location,
    postedDate: j.publication_date,
    salary: j.salary || undefined,
  }));
}
