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
import {
  addInterviewEvent,
  removeInterviewEvent,
} from "../calendar/interviewCalendar";
import { InterviewScheduler } from "../components/InterviewScheduler";
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
  const { applications, setStatus, setInterview, removeJob } = useApplications();
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [scheduling, setScheduling] = useState<Application | null>(null);

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

  // Choosing "Audience" is what triggers scheduling; every other status just
  // sets the status. Moving *away* from it clears the date and takes the
  // calendar event with it, so a cancelled interview doesn't leave a ghost
  // reminder on the device.
  const onStatusPress = async (app: Application, status: ApplicationStatus) => {
    if (status === "interview") {
      setScheduling(app);
      return;
    }

    if (app.status === "interview" && app.interviewDate) {
      if (app.calendarEventId) await removeInterviewEvent(app.calendarEventId);
      await setInterview(app.jobId, undefined, undefined);
    }
    await setStatus(app.jobId, status);
  };

  const onConfirmSchedule = async (app: Application, date: Date) => {
    setScheduling(null);

    // Replace any previously synced event rather than stacking duplicates.
    if (app.calendarEventId) await removeInterviewEvent(app.calendarEventId);

    const result = await addInterviewEvent({
      title: `Interview — ${app.job.title} @ ${app.job.company}`,
      start: date,
      notes: `Jobba the Hunt\n${app.job.company} · ${app.job.title}\n${app.job.url}`,
      url: app.job.url,
    });

    await setInterview(
      app.jobId,
      date.toISOString(),
      result.ok ? result.eventId : undefined
    );
    await setStatus(app.jobId, "interview");

    Alert.alert(
      result.ok ? "Audience locked in" : "Saved to tracker only",
      result.ok
        ? `Added to your calendar with reminders a day and an hour before.`
        : result.message
    );
  };

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
                    onPress={() => onStatusPress(item, status)}
                  >
                    <Text style={[styles.statusPillText, active && { color: accent }]}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {item.interviewDate && (
              <Pressable style={styles.interviewRow} onPress={() => setScheduling(item)}>
                <Text style={styles.interviewText}>
                  {formatInterview(item.interviewDate)}
                </Text>
                <Text style={styles.interviewSync}>
                  {item.calendarEventId ? "· in calendar" : "· tracker only"}
                </Text>
              </Pressable>
            )}

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

      {scheduling && (
        <InterviewScheduler
          visible
          jobTitle={`${scheduling.job.title} @ ${scheduling.job.company}`}
          initialDate={scheduling.interviewDate}
          onCancel={() => setScheduling(null)}
          onConfirm={(date) => onConfirmSchedule(scheduling, date)}
        />
      )}
    </View>
  );
}

function formatInterview(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date unreadable";
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  interviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: palette.saberPurple,
    paddingLeft: spacing.sm,
  },
  interviewText: { ...type.label, fontSize: 10, color: palette.saberPurple },
  interviewSync: { ...type.body, fontSize: 10, color: palette.textFaint },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  link: { ...type.label, fontSize: 10, color: palette.saberBlue },
  removeLink: { color: palette.saberRed },
});
