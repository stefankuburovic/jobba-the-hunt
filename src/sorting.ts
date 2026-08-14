import { Job } from "./types";

export type SortMode = "newest" | "oldest" | "salary" | "company";

export const SORT_LABELS: Record<SortMode, string> = {
  newest: "Freshest",
  oldest: "Oldest",
  salary: "Top pay",
  company: "Employer A–Z",
};

export const SORT_ORDER: SortMode[] = ["newest", "oldest", "salary", "company"];

export interface FeedFilters {
  remoteOnly: boolean;
  withSalary: boolean;
  flaggedOnly: boolean;
}

export const DEFAULT_FILTERS: FeedFilters = {
  remoteOnly: false,
  withSalary: false,
  flaggedOnly: false,
};

function time(job: Job): number {
  const t = new Date(job.postedDate).getTime();
  // Undated postings sort last rather than poisoning the comparator with NaN.
  return Number.isNaN(t) ? 0 : t;
}

function pay(job: Job): number {
  return job.salaryMax ?? job.salaryMin ?? 0;
}

export function sortJobs(jobs: Job[], mode: SortMode): Job[] {
  const copy = [...jobs];

  switch (mode) {
    case "newest":
      return copy.sort((a, b) => time(b) - time(a));
    case "oldest":
      return copy.sort((a, b) => time(a) - time(b));
    case "salary":
      // Postings without a number keep their relative order at the bottom
      // instead of being scattered through the paid ones.
      return copy.sort((a, b) => pay(b) - pay(a) || time(b) - time(a));
    case "company":
      return copy.sort(
        (a, b) => a.company.localeCompare(b.company) || time(b) - time(a)
      );
  }
}

export function applyFilters(
  jobs: Job[],
  filters: FeedFilters,
  isFlagged: (job: Job) => boolean
): Job[] {
  return jobs.filter((job) => {
    if (filters.remoteOnly && !job.remote) return false;
    if (filters.withSalary && !job.salaryMin && !job.salaryMax && !job.salary) {
      return false;
    }
    if (filters.flaggedOnly && !isFlagged(job)) return false;
    return true;
  });
}

/** Compact pay label, e.g. "$90k–$120k". */
export function salaryLabel(job: Job): string | undefined {
  const { salaryMin, salaryMax, salaryCurrency, salary } = job;
  if (!salaryMin && !salaryMax) return salary;

  const symbol = salaryCurrency === "USD" ? "$" : salaryCurrency ? `${salaryCurrency} ` : "";
  const short = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

  if (salaryMin && salaryMax && salaryMin !== salaryMax) {
    return `${symbol}${short(salaryMin)}–${short(salaryMax)}`;
  }
  return `${symbol}${short(salaryMax ?? salaryMin ?? 0)}`;
}
