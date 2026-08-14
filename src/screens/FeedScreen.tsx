import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FeedCursor, fetchFeedPage } from "../api";
import { JobCard } from "../components/JobCard";
import { Starfield } from "../components/Starfield";
import { useApplications } from "../context/ApplicationsContext";
import { palette, spacing, type } from "../theme";
import { Job } from "../types";

export function FeedScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("frontend");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveJob, isSaved } = useApplications();

  // Cursor and seen-ids live in refs: they're read inside async loads and
  // must reflect the latest fetch, not the render that scheduled it.
  const cursor = useRef<FeedCursor | null>(null);
  const seenIds = useRef(new Set<string>());
  // Guards against onEndReached firing repeatedly while a page is in flight.
  const inFlight = useRef(false);

  const load = useCallback(async (query: string, mode: "reset" | "more") => {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      if (mode === "reset") {
        cursor.current = null;
        seenIds.current = new Set();
        setExhausted(false);
        setError(null);
      }

      const result = await fetchFeedPage(query, cursor.current);
      cursor.current = result.cursor;
      setExhausted(result.cursor === null);
      setRateLimited(result.rateLimited);

      // The sources overlap and Arbeitnow pages can repeat a posting, so
      // dedupe against everything already on screen.
      const fresh = result.jobs.filter((j) => !seenIds.current.has(j.id));
      for (const j of fresh) seenIds.current.add(j.id);

      setJobs((prev) => (mode === "reset" ? fresh : [...prev, ...fresh]));

      setError(
        result.failedSources.length > 0
          ? `Lost contact with ${result.failedSources.join(", ")} — showing the rest`
          : null
      );
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(search, "reset").finally(() => setLoading(false));
    // Only re-run on mount — search is applied on submit, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // `rateLimited` deliberately blocks the automatic path: retrying on every
    // scroll would just dig the 429 deeper. The footer offers a manual retry.
    if (loading || loadingMore || exhausted || rateLimited || inFlight.current) {
      return;
    }
    loadMore();
  }, [loadMore, loading, loadingMore, exhausted, rateLimited]);

  const onSave = useCallback(
    (job: Job) => {
      saveJob(job);
    },
    [saveJob]
  );

  const onApply = useCallback(
    async (job: Job) => {
      await saveJob(job); // saving first means "Apply" always leaves a tracker row
      const can = await Linking.canOpenURL(job.url);
      if (can) {
        Linking.openURL(job.url);
      } else {
        Alert.alert("Comms down", `Couldn't open the posting:\n${job.url}`);
      }
    },
    [saveJob]
  );

  return (
    <View style={styles.container}>
      <Starfield />

      <View style={styles.scanBar}>
        <Text style={styles.scanLabel}>Scanning for</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSubmitSearch}
            placeholder="react, angular, typescript…"
            placeholderTextColor={palette.textFaint}
            selectionColor={palette.crawl}
            returnKeyType="search"
          />
          <Pressable style={styles.searchButton} onPress={onSubmitSearch}>
            <Text style={styles.searchButtonText}>Scan</Text>
          </Pressable>
        </View>
      </View>

      {error && <Text style={styles.errorBanner}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={palette.crawl} />
          <Text style={styles.loadingText}>Sweeping the Outer Rim…</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
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
            <Text style={styles.empty}>
              These aren't the jobs you're looking for.{"\n"}Try a different scan term.
            </Text>
          }
          ListFooterComponent={
            jobs.length === 0 ? null : loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={palette.saberBlue} />
                <Text style={styles.footerText}>Scanning deeper…</Text>
              </View>
            ) : rateLimited ? (
              <Pressable style={styles.footer} onPress={loadMore}>
                <Text style={styles.footerWarn}>
                  The board is throttling us — tap to resume the scan
                </Text>
              </Pressable>
            ) : exhausted ? (
              <Text style={styles.footerText}>
                — end of the scan · {jobs.length} bounties —
              </Text>
            ) : null
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.void },
  scanBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: "rgba(14,19,28,0.85)",
  },
  scanLabel: {
    ...type.label,
    fontSize: 9,
    color: palette.textFaint,
    marginBottom: spacing.xs,
  },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  searchInput: {
    ...type.body,
    flex: 1,
    backgroundColor: palette.panelAlt,
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
  footerText: {
    ...type.label,
    fontSize: 9,
    color: palette.textFaint,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  empty: {
    ...type.body,
    textAlign: "center",
    color: palette.textDim,
    marginTop: 60,
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
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
    backgroundColor: palette.panelAlt,
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
