import { Job } from "../types";
import { fetchArbeitnowJobs } from "./arbeitnow";
import { fetchRemotiveJobs } from "./remotive";

export interface FeedResult {
  jobs: Job[];
  failedSources: string[];
}

// Fetches from every legal, key-free source in parallel and merges the
// results. A source failing (rate limit, downtime) never blocks the others —
// we surface which ones failed so the UI can say so instead of pretending
// the feed is complete.
export async function fetchAllJobs(search = "frontend"): Promise<FeedResult> {
  const sources: Array<{ name: string; fn: () => Promise<Job[]> }> = [
    { name: "Remotive", fn: () => fetchRemotiveJobs(search) },
    { name: "Arbeitnow", fn: () => fetchArbeitnowJobs() },
  ];

  const results = await Promise.allSettled(sources.map((s) => s.fn()));

  const jobs: Job[] = [];
  const failedSources: string[] = [];
  const seen = new Set<string>();

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      for (const job of result.value) {
        if (!seen.has(job.id)) {
          seen.add(job.id);
          jobs.push(job);
        }
      }
    } else {
      failedSources.push(sources[i].name);
    }
  });

  jobs.sort(
    (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
  );

  return { jobs, failedSources };
}
