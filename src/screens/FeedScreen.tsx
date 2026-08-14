import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ALL_SOURCE_FILTERS, FeedCursor, fetchFeedPage, SourceFilter } from "../api";
import { requiredAttributions, SOURCES } from "../api/sources";
import { JobCard } from "../components/JobCard";
import { ScanTicker, useScanTicker } from "../components/ScanTicker";
import { SourcePicker } from "../components/SourcePicker";
import { Starfield } from "../components/Starfield";
import { useStarfield } from "../components/StarfieldProvider";
import { useApplications } from "../context/ApplicationsContext";
import { useTargets } from "../context/TargetsContext";
import { failureLine, failureMessage } from "../messages";
import { cacheAge, loadFeedCache, saveFeedCache } from "../storage/feedCache";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
} from "../storage/preferences";
import { dedupePostings } from "../dedupe";
import { findStarWarsReference } from "../starwars";
import {
  applyFilters,
  DEFAULT_FILTERS,
  FeedFilters,
  SORT_LABELS,
  SORT_ORDER,
  SortMode,
  sortJobs,
} from "../sorting";
import { palette, spacing, type } from "../theme";
import { Job } from "../types";

const isFlagged = (job: Job) =>
  findStarWarsReference(job.title, job.description) !== null;

export function FeedScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  // Starts empty on purpose: the feed opens on everything the boards have,
  // and a keyword narrows it only when you actually type one.
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>(DEFAULT_PREFERENCES.sort);
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_PREFERENCES.filters);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceFilter[]>(DEFAULT_PREFERENCES.sources);
  // Preferences load asynchronously; saving before they arrive would write
  // the defaults straight over what the user last chose.
  const prefsLoaded = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Set while a cached scan is on screen and a fresh one runs behind it.
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);

  const { saveJob, isSaved } = useApplications();
  const { targets } = useTargets();
  const { burst, jumpToLightspeed, reset } = useStarfield();
  const scan = useScanTicker();

  const cursor = useRef<FeedCursor | null>(null);
  const seenIds = useRef(new Set<string>());
  // Content keys, so a posting a board lists twice under different slugs
  // only occupies one row.
  const seenPostings = useRef(new Set<string>());
  const inFlight = useRef(false);

  const load = useCallback(
    async (query: string, mode: "reset" | "more") => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        if (mode === "reset") {
          cursor.current = null;
          seenIds.current = new Set();
          seenPostings.current = new Set();
          setExhausted(false);
          setError(null);
        }

        const result = await fetchFeedPage({
          search: query,
          targets,
          sources,
          cursor: cursor.current,
          onProgress: scan.push,
        });
        cursor.current = result.cursor;
        setExhausted(result.cursor === null);
        setRateLimited(result.rateLimited);

        // Two passes: the id catches the same row fetched twice, the content
        // key catches the same role listed twice under different ids.
        const unseen = result.jobs.filter((j) => !seenIds.current.has(j.id));
        for (const j of unseen) seenIds.current.add(j.id);
        const fresh = dedupePostings(unseen, seenPostings.current);

        setJobs((prev) => (mode === "reset" ? fresh : [...prev, ...fresh]));

        // Only the opening batch is cached: it's what the next launch shows
        // before anything has been fetched.
        if (mode === "reset" && fresh.length > 0) {
          setRestoredFrom(null);
          saveFeedCache(fresh);
        }

        // Offline outranks a source outage: if the phone has no signal,
        // naming the boards that "failed" would blame the wrong thing.
        setError(
          result.offline
            ? failureLine("offline")
            : result.failedSources.length > 0
              ? failureLine(
                  "source_down",
                  `${result.failedSources.join(", ")} went quiet. Showing the rest.`
                )
              : null
        );
      } finally {
        inFlight.current = false;
      }
    },
    [targets, sources, scan]
  );

  // First paint comes from the cache when there is one: eight boards take
  // ~1.6s, and staring at a spinner every launch for a list that barely
  // changed is the wrong trade. The fresh scan then replaces it in place.
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!prefsLoaded.current) {
        const prefs = await loadPreferences();
        if (cancelled) return;
        prefsLoaded.current = true;
        setSort(prefs.sort);
        setFilters(prefs.filters);
        // Setting sources re-triggers this effect, so the scan below runs
        // with the restored selection rather than the default one.
        if (prefs.sources.join() !== sources.join()) {
          setSources(prefs.sources);
          return;
        }
      }

      const cached = hydrated.current ? null : await loadFeedCache();
      hydrated.current = true;
      if (cancelled) return;

      if (cached) {
        setJobs(cached.jobs);
        for (const j of cached.jobs) seenIds.current.add(j.id);
        dedupePostings(cached.jobs, seenPostings.current);
        setRestoredFrom(cacheAge(cached.savedAt));
        setLoading(false);
        setRescanning(true);
      } else {
        setLoading(true);
      }

      scan.clear();
      await load(search, "reset");
      if (cancelled) return;

      setLoading(false);
      setRescanning(false);
      scan.clear();
    };

    run();
    return () => {
      cancelled = true;
    };
    // Re-runs when the watched employers or the enabled sources change, since
    // both change which boards get contacted. Search is applied on submit,
    // not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets, sources]);

  useEffect(() => {
    if (!prefsLoaded.current) return;
    savePreferences({ sort, filters, sources });
  }, [sort, filters, sources]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(search, "reset");
    setRefreshing(false);
  }, [load, search]);

  const onSubmitSearch = useCallback(async () => {
    setLoading(true);
    await load(search, "reset");
    setLoading(false);
  }, [load, search]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    await load(search, "more");
    setLoadingMore(false);
  }, [load, search]);

  const onEndReached = useCallback(() => {
    // `rateLimited` blocks the automatic path: retrying on every scroll
    // would just dig the 429 deeper. The footer offers a manual retry.
    if (loading || loadingMore || exhausted || rateLimited || inFlight.current) {
      return;
    }
    loadMore();
  }, [loadMore, loading, loadingMore, exhausted, rateLimited]);

  const onSave = useCallback(
    (job: Job) => {
      saveJob(job);
      burst(); // a quick punch to lightspeed acknowledges the catch
    },
    [saveJob, burst]
  );

  const onApply = useCallback(
    async (job: Job) => {
      await saveJob(job); // saving first means "Apply" always leaves a tracker row

      const can = await Linking.canOpenURL(job.url);
      if (!can) {
        const { headline, detail } = failureMessage("link_failed");
        Alert.alert(headline, `${detail}\n\n${job.url}`);
        return;
      }

      // Jump first, hand off second: the screen is fully white before the
      // browser takes over, so there's no half-faded app behind it.
      await jumpToLightspeed();
      await Linking.openURL(job.url);

      // Wind the effect back down behind the browser, so returning to the
      // app lands on the normal feed rather than a white screen.
      setTimeout(reset, 900);
    },
    [saveJob, jumpToLightspeed, reset]
  );

  // Sorting and filtering are view concerns: they reshape what's already
  // loaded rather than re-querying eight boards.
  const visible = useMemo(
    () => sortJobs(applyFilters(jobs, filters, isFlagged), sort),
    [jobs, filters, sort]
  );

  const toggle = (key: keyof FeedFilters) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }));

  return (
    <View style={styles.container}>
      <Starfield />

      <View style={styles.scanBar}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSubmitSearch}
            placeholder="Everything — or type react, python, design…"
            placeholderTextColor={palette.textFaint}
            selectionColor={palette.crawl}
            returnKeyType="search"
          />
          <Pressable style={styles.searchButton} onPress={onSubmitSearch}>
            <Text style={styles.searchButtonText}>Scan</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.controlRow}
        >
          {SORT_ORDER.map((mode) => (
            <Pressable
              key={mode}
              style={[styles.control, sort === mode && styles.controlOn]}
              onPress={() => setSort(mode)}
            >
              <Text style={[styles.controlText, sort === mode && styles.controlTextOn]}>
                {SORT_LABELS[mode]}
              </Text>
            </Pressable>
          ))}

          <View style={styles.divider} />

          <Pressable
            style={[
              styles.control,
              sources.length < ALL_SOURCE_FILTERS.length && styles.controlOn,
            ]}
            onPress={() => setPickerOpen(true)}
          >
            <Text
              style={[
                styles.controlText,
                sources.length < ALL_SOURCE_FILTERS.length && styles.controlTextOn,
              ]}
            >
              Sources {sources.length}/{ALL_SOURCE_FILTERS.length}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.control, filters.remoteOnly && styles.controlOn]}
            onPress={() => toggle("remoteOnly")}
          >
            <Text
              style={[styles.controlText, filters.remoteOnly && styles.controlTextOn]}
            >
              Remote
            </Text>
          </Pressable>
          <Pressable
            style={[styles.control, filters.withSalary && styles.controlOn]}
            onPress={() => toggle("withSalary")}
          >
            <Text
              style={[styles.controlText, filters.withSalary && styles.controlTextOn]}
            >
              Pay listed
            </Text>
          </Pressable>
          <Pressable
            style={[styles.control, filters.flaggedOnly && styles.controlFlagged]}
            onPress={() => toggle("flaggedOnly")}
          >
            <Text
              style={[
                styles.controlText,
                filters.flaggedOnly && styles.controlTextFlagged,
              ]}
            >
              ★ Star Wars
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {restoredFrom && (
        <Text style={styles.cacheBanner}>
          {rescanning
            ? `Last scan from ${restoredFrom} · re-sweeping…`
            : `Last scan from ${restoredFrom}`}
        </Text>
      )}

      {error && <Text style={styles.errorBanner}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={palette.crawl} />
          <Text style={styles.loadingText}>Sweeping the Outer Rim…</Text>
          <ScanTicker event={scan.current} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.crawl}
              colors={[palette.crawl]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyHeadline}>
                {failureMessage("no_results").headline}
              </Text>
              <Text style={styles.empty}>
                {jobs.length > 0
                  ? "Every posting is hidden by the filters above."
                  : failureMessage("no_results").detail}
              </Text>
            </View>
          }
          ListFooterComponent={
            <View>
              {visible.length === 0 ? null : loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={palette.saberBlue} />
                  <Text style={styles.footerSub}>Scanning deeper…</Text>
                </View>
              ) : rateLimited ? (
                <Pressable style={styles.footer} onPress={loadMore}>
                  <Text style={styles.footerWarn}>
                    {failureMessage("rate_limited").headline}
                  </Text>
                  <Text style={styles.footerSub}>Tap to resume the scan</Text>
                </Pressable>
              ) : exhausted ? (
                <Text style={styles.footerText}>
                  — end of the scan · {visible.length} bounties —
                </Text>
              ) : null}

              <Attribution />
            </View>
          }
          renderItem={({ item }) => (
            <View>
              <JobCard job={item} />
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionButton, isSaved(item.id) && styles.trackedButton]}
                  disabled={isSaved(item.id)}
                  onPress={() => onSave(item)}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      isSaved(item.id) && styles.trackedButtonText,
                    ]}
                  >
                    {isSaved(item.id) ? "Tracking ✓" : "Track target"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.applyButton]}
                  onPress={() => onApply(item)}
                >
                  <Text style={[styles.actionButtonText, styles.applyButtonText]}>
                    Engage →
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
      <SourcePicker
        visible={pickerOpen}
        enabled={sources}
        targetCount={targets.length}
        onToggle={(source) =>
          setSources((prev) =>
            prev.includes(source)
              ? prev.filter((s) => s !== source)
              : [...prev, source]
          )
        }
        onSetAll={(all) => setSources(all ? ALL_SOURCE_FILTERS : [])}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

/**
 * Visible credit for the boards behind the feed.
 *
 * Remote OK's API terms require naming them as a source and linking back, so
 * this lives in the feed rather than a settings page nobody opens. Their
 * logo is a registered trademark and is deliberately not used — the terms
 * ask for the name, and only the name is what appears.
 */
function Attribution() {
  const notes = requiredAttributions();

  return (
    <View style={styles.attribution}>
      <Text style={styles.attributionLabel}>Sources</Text>
      <View style={styles.attributionRow}>
        {Object.values(SOURCES).map((s) => (
          <Pressable key={s.label} onPress={() => Linking.openURL(s.homepage)}>
            <Text style={styles.attributionLink}>{s.label} ↗</Text>
          </Pressable>
        ))}
      </View>
      {notes.map((note) => (
        <Text key={note} style={styles.attributionNote}>
          {note}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.void },
  scanBar: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: "rgba(14,19,28,0.85)",
  },
  searchRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md },
  searchInput: {
    ...type.body,
    flex: 1,
    backgroundColor: palette.panelAltTranslucent,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 3,
    color: palette.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchButton: {
    borderWidth: 1,
    borderColor: palette.crawl,
    borderRadius: 3,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  searchButtonText: { ...type.label, fontSize: 12, color: palette.crawl },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  control: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAltTranslucent,
    borderRadius: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  controlOn: { borderColor: palette.saberBlue, backgroundColor: "rgba(79,195,247,0.12)" },
  controlFlagged: { borderColor: palette.crawl, backgroundColor: "rgba(255,232,31,0.12)" },
  controlText: { ...type.label, fontSize: 9, color: palette.textDim },
  controlTextOn: { color: palette.saberBlue },
  controlTextFlagged: { color: palette.crawl },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: palette.border,
    marginHorizontal: spacing.xs,
  },
  cacheBanner: {
    ...type.label,
    fontSize: 9,
    color: palette.saberBlue,
    backgroundColor: "rgba(79,195,247,0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(79,195,247,0.22)",
    padding: spacing.sm,
    textAlign: "center",
  },
  errorBanner: {
    ...type.label,
    fontSize: 10,
    color: palette.crawl,
    backgroundColor: "rgba(255,232,31,0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,232,31,0.25)",
    padding: spacing.sm,
    textAlign: "center",
  },
  loadingBox: { marginTop: 60, alignItems: "center", gap: spacing.md },
  loadingText: { ...type.label, fontSize: 11, color: palette.textDim },
  footer: { paddingVertical: spacing.lg, alignItems: "center", gap: spacing.sm },
  footerWarn: { ...type.label, fontSize: 10, color: palette.crawl, textAlign: "center" },
  footerSub: { ...type.body, fontSize: 10, color: palette.textFaint, textAlign: "center" },
  footerText: {
    ...type.label,
    fontSize: 9,
    color: palette.textFaint,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  emptyBox: { marginTop: 60, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyHeadline: {
    ...type.display,
    fontSize: 14,
    color: palette.crawl,
    textAlign: "center",
  },
  empty: { ...type.body, textAlign: "center", color: palette.textDim, lineHeight: 22 },
  attribution: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  attributionLabel: { ...type.label, fontSize: 9, color: palette.textFaint },
  attributionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  attributionLink: { ...type.body, fontSize: 10, color: palette.saberBlue },
  attributionNote: {
    ...type.body,
    fontSize: 10,
    color: palette.textFaint,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAltTranslucent,
    borderRadius: 3,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  actionButtonText: { ...type.label, fontSize: 11, color: palette.textDim },
  trackedButton: { borderColor: "rgba(74,222,128,0.4)" },
  trackedButtonText: { color: palette.saberGreen },
  applyButton: { borderColor: palette.crawl, backgroundColor: "rgba(255,232,31,0.08)" },
  applyButtonText: { color: palette.crawl },
});
