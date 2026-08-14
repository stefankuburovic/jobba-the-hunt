import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "jobba:targets";

interface TargetsContextValue {
  /** Greenhouse board slugs the user is watching. */
  targets: string[];
  loading: boolean;
  addTarget: (slug: string) => Promise<void>;
  removeTarget: (slug: string) => Promise<void>;
}

const TargetsContext = createContext<TargetsContextValue | undefined>(undefined);

/** Slugs are lowercase, no spaces — normalise so "Stripe " and "stripe" match. */
function normalise(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:boards|job-boards)\.greenhouse\.io\//, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * The employers whose Greenhouse boards get pulled into the feed — Phase 4
 * of the concept. Kept separate from saved applications: this is a watch
 * list of companies, not of postings.
 */
export function TargetsProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setTargets(parsed.filter(Boolean));
        } catch {
          // Corrupt list shouldn't block the app — start empty.
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (next: string[]) => {
    setTargets(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addTarget = useCallback(
    async (slug: string) => {
      const clean = normalise(slug);
      if (!clean || targets.includes(clean)) return;
      await persist([...targets, clean]);
    },
    [targets, persist]
  );

  const removeTarget = useCallback(
    async (slug: string) => {
      await persist(targets.filter((t) => t !== slug));
    },
    [targets, persist]
  );

  return (
    <TargetsContext.Provider value={{ targets, loading, addTarget, removeTarget }}>
      {children}
    </TargetsContext.Provider>
  );
}

export function useTargets(): TargetsContextValue {
  const ctx = useContext(TargetsContext);
  if (!ctx) throw new Error("useTargets must be used within a TargetsProvider");
  return ctx;
}
