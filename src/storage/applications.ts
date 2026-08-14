import AsyncStorage from "@react-native-async-storage/async-storage";
import { Application, ApplicationStatus, Job } from "../types";

const STORAGE_KEY = "jobba:applications";

type ApplicationsMap = Record<string, Application>;

export async function loadApplications(): Promise<ApplicationsMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ApplicationsMap;
  } catch {
    // Corrupt local data shouldn't crash the app — start fresh rather than
    // throwing on every launch.
    return {};
  }
}

async function persist(map: ApplicationsMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function saveJob(job: Job): Promise<ApplicationsMap> {
  const map = await loadApplications();
  if (!map[job.id]) {
    map[job.id] = {
      jobId: job.id,
      job,
      status: "new",
      savedDate: new Date().toISOString(),
    };
    await persist(map);
  }
  return map;
}

export async function setStatus(
  jobId: string,
  status: ApplicationStatus
): Promise<ApplicationsMap> {
  const map = await loadApplications();
  const existing = map[jobId];
  if (!existing) return map;

  map[jobId] = {
    ...existing,
    status,
    appliedDate:
      status === "applied" && !existing.appliedDate
        ? new Date().toISOString()
        : existing.appliedDate,
  };
  await persist(map);
  return map;
}

export async function setNotes(jobId: string, notes: string): Promise<ApplicationsMap> {
  const map = await loadApplications();
  if (!map[jobId]) return map;
  map[jobId] = { ...map[jobId], notes };
  await persist(map);
  return map;
}

export async function removeJob(jobId: string): Promise<ApplicationsMap> {
  const map = await loadApplications();
  delete map[jobId];
  await persist(map);
  return map;
}
