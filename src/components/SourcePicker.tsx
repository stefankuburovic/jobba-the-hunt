import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ALL_SOURCE_FILTERS, SourceFilter } from "../api";
import { SOURCES } from "../api/sources";
import { modalSheet, palette, spacing, type } from "../theme";

interface Props {
  visible: boolean;
  enabled: SourceFilter[];
  /** Greenhouse only makes sense as a toggle once something is being watched. */
  targetCount: number;
  onToggle: (source: SourceFilter) => void;
  onSetAll: (all: boolean) => void;
  onClose: () => void;
}

function label(source: SourceFilter, targetCount: number): string {
  if (source === "greenhouse") {
    return `Marks · ${targetCount} employer${targetCount === 1 ? "" : "s"}`;
  }
  return SOURCES[source].label;
}

/**
 * Chooses which boards the scan contacts.
 *
 * Disabling a source skips the request entirely rather than hiding its rows
 * afterwards — fewer calls means a faster scan and less pressure on the
 * boards that rate-limit. That's also why changing this reloads the feed.
 */
export function SourcePicker({
  visible,
  enabled,
  targetCount,
  onToggle,
  onSetAll,
  onClose,
}: Props) {
  const available = ALL_SOURCE_FILTERS.filter(
    (s) => s !== "greenhouse" || targetCount > 0
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.stripe} />
          <Text style={styles.title}>Sensor array</Text>
          <Text style={styles.subtitle}>
            Which boards the scan sweeps. Switching one off skips the call
            entirely, so the scan runs faster.
          </Text>

          <ScrollView style={styles.list}>
            {available.map((source) => {
              const on = enabled.includes(source);
              return (
                <Pressable
                  key={source}
                  style={[styles.row, on && styles.rowOn]}
                  onPress={() => onToggle(source)}
                >
                  <Text style={[styles.rowText, on && styles.rowTextOn]}>
                    {label(source, targetCount)}
                  </Text>
                  <Text style={[styles.state, on && styles.stateOn]}>
                    {on ? "ONLINE" : "OFFLINE"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={() => onSetAll(false)}>
              <Text style={styles.actionText}>None</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => onSetAll(true)}>
              <Text style={styles.actionText}>All</Text>
            </Pressable>
            <Pressable style={[styles.action, styles.done]} onPress={onClose}>
              <Text style={[styles.actionText, styles.doneText]}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,3,6,0.86)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    ...modalSheet(480),
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    padding: spacing.lg,
    maxHeight: "80%",
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.saberBlue,
  },
  title: { ...type.display, fontSize: 15, color: palette.saberBlue },
  subtitle: {
    ...type.body,
    fontSize: 11,
    color: palette.textDim,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  list: { marginTop: spacing.md, flexGrow: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAltTranslucent,
    borderRadius: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  rowOn: { borderColor: "rgba(79,195,247,0.5)" },
  rowText: { ...type.label, fontSize: 11, color: palette.textFaint },
  rowTextOn: { color: palette.text },
  state: { ...type.label, fontSize: 8, color: palette.textFaint },
  stateOn: { color: palette.saberGreen },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  action: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAltTranslucent,
    borderRadius: 3,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  actionText: { ...type.label, fontSize: 11, color: palette.textDim },
  done: { borderColor: palette.crawl, backgroundColor: "rgba(255,232,31,0.08)" },
  doneText: { color: palette.crawl },
});
