import AsyncStorage from "@react-native-async-storage/async-storage";
import { ALL_SOURCE_FILTERS, SourceFilter } from "../api";
import { DEFAULT_FILTERS, FeedFilters, SortMode, SORT_ORDER } from "../sorting";

const STORAGE_KEY = "jobba:preferences";

export interface FeedPreferences {
  sort: SortMode;
  filters: FeedFilters;
  sources: SourceFilter[];
}

export const DEFAULT_PREFERENCES: FeedPreferences = {
  sort: "newest",
  filters: DEFAULT_FILTERS,
  sources: ALL_SOURCE_FILTERS,
};

/**
 * Stored preferences are user data from a previous app version, so every
 * field is validated rather than trusted — a renamed sort mode or a dropped
 * source would otherwise leave the feed in a state the UI can't represent.
 */
function reconcile(raw: unknown): FeedPreferences {
  const parsed = (raw ?? {}) as Partial<FeedPreferences>;

  const sort =
    parsed.sort && SORT_ORDER.includes(parsed.sort)
      ? parsed.sort
      : DEFAULT_PREFERENCES.sort;

  const sources = Array.isArray(parsed.sources)
    ? parsed.sources.filter((s) => ALL_SOURCE_FILTERS.includes(s))
    : DEFAULT_PREFERENCES.sources;

  return {
    sort,
    filters: { ...DEFAULT_FILTERS, ...(parsed.filters ?? {}) },
    sources,
  };
}

export async function loadPreferences(): Promise<FeedPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_PREFERENCES;

  try {
    return reconcile(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: FeedPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Preferences are a convenience — never worth surfacing a failure.
  }
}
