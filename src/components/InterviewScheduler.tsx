import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { modalSheet, palette, spacing, type } from "../theme";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MINUTE_STEP = 15;

/** Monday-first column index for a date. */
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface Props {
  visible: boolean;
  initialDate?: string; // ISO
  jobTitle: string;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

/**
 * Date + time picker built in plain React Native.
 *
 * A native picker would mean another native dependency, and the one feature
 * this screen leads to — calendar sync — already can't run in Expo Go.
 * Keeping the picker pure JS means scheduling still works there.
 */
export function InterviewScheduler({
  visible,
  initialDate,
  jobTitle,
  onCancel,
  onConfirm,
}: Props) {
  const initial = useMemo(() => {
    const base = initialDate ? new Date(initialDate) : new Date();
    if (Number.isNaN(base.getTime())) return new Date();
    return base;
  }, [initialDate]);

  const [selected, setSelected] = useState<Date>(initial);
  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(initial.getFullYear(), initial.getMonth(), 1)
  );

  const grid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const daysInMonth = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + 1,
      0
    ).getDate();

    const cells: Array<Date | null> = Array(weekdayIndex(first)).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
    }
    return cells;
  }, [viewMonth]);

  const shiftMonth = (delta: number) =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));

  const pickDay = (day: Date) => {
    const next = new Date(day);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setSelected(next);
  };

  const shiftTime = (minutes: number) => {
    setSelected(new Date(selected.getTime() + minutes * 60_000));
  };

  const today = startOfDay(new Date());
  const isPast = selected.getTime() < Date.now();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Schedule audience</Text>
          <Text style={styles.subheading} numberOfLines={2}>
            {jobTitle}
          </Text>

          <View style={styles.monthRow}>
            <Pressable hitSlop={12} onPress={() => shiftMonth(-1)}>
              <Text style={styles.monthArrow}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </Text>
            <Pressable hitSlop={12} onPress={() => shiftMonth(1)}>
              <Text style={styles.monthArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          <ScrollView style={styles.gridScroll}>
            <View style={styles.grid}>
              {grid.map((day, i) => {
                if (!day) return <View key={`blank-${i}`} style={styles.dayCell} />;
                const active = sameDay(day, selected);
                const past = startOfDay(day) < today;
                return (
                  <Pressable
                    key={day.toISOString()}
                    style={[styles.dayCell, active && styles.dayCellActive]}
                    onPress={() => pickDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        past && styles.dayTextPast,
                        active && styles.dayTextActive,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.timeRow}>
            <Pressable style={styles.timeBtn} onPress={() => shiftTime(-60)}>
              <Text style={styles.timeBtnText}>−1h</Text>
            </Pressable>
            <Pressable style={styles.timeBtn} onPress={() => shiftTime(-MINUTE_STEP)}>
              <Text style={styles.timeBtnText}>−15m</Text>
            </Pressable>
            <Text style={styles.clock}>
              {String(selected.getHours()).padStart(2, "0")}:
              {String(selected.getMinutes()).padStart(2, "0")}
            </Text>
            <Pressable style={styles.timeBtn} onPress={() => shiftTime(MINUTE_STEP)}>
              <Text style={styles.timeBtnText}>+15m</Text>
            </Pressable>
            <Pressable style={styles.timeBtn} onPress={() => shiftTime(60)}>
              <Text style={styles.timeBtnText}>+1h</Text>
            </Pressable>
          </View>

          {isPast && (
            <Text style={styles.pastWarn}>
              That moment has already passed — no reminder will fire.
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={onCancel}>
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.action, styles.confirm]}
              onPress={() => onConfirm(selected)}
            >
              <Text style={[styles.actionText, styles.confirmText]}>Lock it in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,3,6,0.85)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    ...modalSheet(460),
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    padding: spacing.lg,
    maxHeight: "88%",
  },
  heading: { ...type.display, fontSize: 16, color: palette.crawl },
  subheading: {
    ...type.body,
    fontSize: 12,
    color: palette.textDim,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  monthArrow: { color: palette.saberBlue, fontSize: 26, paddingHorizontal: spacing.md },
  monthLabel: { ...type.label, fontSize: 12, color: palette.text },
  weekRow: { flexDirection: "row" },
  weekday: {
    ...type.label,
    fontSize: 9,
    color: palette.textFaint,
    width: `${100 / 7}%`,
    textAlign: "center",
  },
  gridScroll: { flexGrow: 0 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.xs },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellActive: { backgroundColor: "rgba(255,232,31,0.14)", borderRadius: 3 },
  dayText: { ...type.body, fontSize: 13, color: palette.text },
  dayTextPast: { color: palette.textFaint },
  dayTextActive: { color: palette.crawl, fontWeight: "700" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  timeBtn: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAlt,
    borderRadius: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  timeBtnText: { ...type.label, fontSize: 9, color: palette.textDim },
  clock: { ...type.display, fontSize: 22, color: palette.saberBlue },
  pastWarn: {
    ...type.body,
    fontSize: 11,
    color: palette.crawl,
    marginTop: spacing.sm,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  action: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAlt,
    borderRadius: 3,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  actionText: { ...type.label, fontSize: 11, color: palette.textDim },
  confirm: { borderColor: palette.crawl, backgroundColor: "rgba(255,232,31,0.08)" },
  confirmText: { color: palette.crawl },
});
