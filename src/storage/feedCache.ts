import AsyncStorage from "@react-native-async-storage/async-storage";
import { Job } from "../types";

const STORAGE_KEY = "jobba:feedCache";

// A full scan is 500+ postings and Greenhouse descriptions alone run to tens
// of kilobytes. AsyncStorage is SQLite-backed with a per-row ceiling, so the
// cache keeps only enough to fill the first screens and trims the prose —
// the full description is re-fetched with the background refresh anyway.
const MAX_JOBS = 150;
const MAX_DESCRIPTION = 1200;

interface CachedFeed {
  savedAt: string; // ISO
  jobs: Job[];
}

function slim(job: Job): Job {
  return job.description.length > MAX_DESCRIPTION
    ? { ...job, description: `${job.description.slice(0, MAX_DESCRIPTION)}…` }
    : job;
}

export async function loadFeedCache(): Promise<CachedFeed | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedFeed;
    if (!Array.isArray(parsed?.jobs) || parsed.jobs.length === 0) return null;
    return parsed;
  } catch {
    // A corrupt cache is never worth crashing over — scan fresh instead.
    return null;
  }
}

export async function saveFeedCache(jobs: Job[]): Promise<void> {
  if (jobs.length === 0) return;

  const payload: CachedFeed = {
    savedAt: new Date().toISOString(),
    jobs: jobs.slice(0, MAX_JOBS).map(slim),
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Out of quota or similar: the cache is an optimisation, not state we
    // can't live without.
  }
}

/** "4 minutes ago" — used to say how stale the restored scan is. */
export function cacheAge(savedAt: string): string {
  const minutes = Math.floor((Date.now() - new Date(savedAt).getTime()) / 60_000);
  if (minutes < 1) return "moments ago";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
