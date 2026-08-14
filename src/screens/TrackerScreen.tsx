import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { JobCard } from "../components/JobCard";
import { Starfield } from "../components/Starfield";
import { useApplications } from "../context/ApplicationsContext";
import { palette, spacing, type } from "../theme";
import {
  Application,
  ApplicationStatus,
  STATUS_COLORS,
  STATUS_HINTS,
  STATUS_LABELS,
  STATUS_ORDER,
} from "../types";

const FILTERS: Array<ApplicationStatus | "all"> = ["all", ...STATUS_ORDER];

export function TrackerScreen() {
  const { applications, setStatus, removeJob } = useApplications();
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  const list = useMemo(() => {
    const all = Object.values(applications).sort(
      (a, b) => new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime()
    );
    return filter === "all" ? all : all.filter((a) => a.status === filter);
  }, [applications, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: Object.keys(applications).length };
    for (const status of STATUS_ORDER) c[status] = 0;
    for (const app of Object.values(applications)) c[app.status] = (c[app.status] ?? 0) + 1;
    return c;
  }, [applications]);

  const confirmRemove = (app: Application) => {
    Alert.alert("Jettison this bounty?", app.job.title, [
      { text: "Cancel", style: "cancel" },
      { text: "Jettison", style: "destructive", onPress: () => removeJob(app.jobId) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Starfield />

      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f}
          contentContainerStyle={{ paddingHorizontal: spacing.sm }}
          renderItem={({ item }) => {
            const active = filter === item;
            const accent = item === "all" ? palette.crawl : STATUS_COLORS[item];
            return (
              <Pressable
                style={[
                  styles.chip,
                  active && { borderColor: accent, backgroundColor: `${accent}1A` },
                ]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.chipText, active && { color: accent }]}>
                  {item === "all" ? "All bounties" : STATUS_LABELS[item]} ·{" "}
                  {counts[item] ?? 0}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(a) => a.jobId}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            The bounty log is empty.{"\n"}Track a target from the Bounty Board.
          </Text>
        }
        renderItem={({ item }) => (
          <View>
            <JobCard job={item.job} />

            <Text style={styles.statusHint}>{STATUS_HINTS[item.status]}</Text>

            <View style={styles.statusRow}>
              {STATUS_ORDER.map((status) => {
                const active = item.status === status;
                const accent = STATUS_COLORS[status];
                return (
                  <Pressable
                    key={status}
                    style={[
                      styles.statusPill,
                      active && { borderColor: accent, backgroundColor: `${accent}1A` },
                    ]}
                    onPress={() => setStatus(item.jobId, status)}
                  >
                    <Text style={[styles.statusPillText, active && { color: accent }]}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.linkRow}>
              <Pressable onPress={() => Linking.openURL(item.job.url)}>
                <Text style={styles.link}>Open posting ↗</Text>
              </Pressable>
              <Pressable onPress={() => confirmRemove(item)}>
                <Text style={[styles.link, styles.removeLink]}>Jettison</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.void },
  filterBar: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: "rgba(14,19,28,0.85)",
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAlt,
    borderRadius: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginHorizontal: spacing.xs,
  },
  chipText: { ...type.label, fontSize: 10, color: palette.textDim },
  empty: {
    ...type.body,
    textAlign: "center",
    color: palette.textDim,
    marginTop: 60,
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  statusHint: {
    ...type.body,
    fontSize: 11,
    color: palette.textFaint,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  statusPill: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAlt,
    borderRadius: 3,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  statusPillText: { ...type.label, fontSize: 9, color: palette.textDim },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  link: { ...type.label, fontSize: 10, color: palette.saberBlue },
  removeLink: { color: palette.saberRed },
});
