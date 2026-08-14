import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as store from "../storage/applications";
import { Application, ApplicationStatus, Job } from "../types";

interface ApplicationsContextValue {
  applications: Record<string, Application>;
  loading: boolean;
  saveJob: (job: Job) => Promise<void>;
  setStatus: (jobId: string, status: ApplicationStatus) => Promise<void>;
  setNotes: (jobId: string, notes: string) => Promise<void>;
  removeJob: (jobId: string) => Promise<void>;
  isSaved: (jobId: string) => boolean;
}

const ApplicationsContext = createContext<ApplicationsContextValue | undefined>(
  undefined
);

// Single source of truth for saved jobs, shared between the Feed and
// Tracker screens so a "Save" on one tab shows up instantly on the other —
// no prop drilling, no re-fetch-from-storage race between screens.
export function ApplicationsProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Record<string, Application>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.loadApplications().then((map) => {
      setApplications(map);
      setLoading(false);
    });
  }, []);

  const saveJob = useCallback(async (job: Job) => {
    const map = await store.saveJob(job);
    setApplications(map);
  }, []);

  const setStatus = useCallback(async (jobId: string, status: ApplicationStatus) => {
    const map = await store.setStatus(jobId, status);
    setApplications(map);
  }, []);

  const setNotes = useCallback(async (jobId: string, notes: string) => {
    const map = await store.setNotes(jobId, notes);
    setApplications(map);
  }, []);

  const removeJob = useCallback(async (jobId: string) => {
    const map = await store.removeJob(jobId);
    setApplications(map);
  }, []);

  const isSaved = useCallback(
    (jobId: string) => Boolean(applications[jobId]),
    [applications]
  );

  return (
    <ApplicationsContext.Provider
      value={{ applications, loading, saveJob, setStatus, setNotes, removeJob, isSaved }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications(): ApplicationsContextValue {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) {
    throw new Error("useApplications must be used within an ApplicationsProvider");
  }
  return ctx;
}
