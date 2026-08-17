import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { modalSheet, palette, spacing, type } from "../theme";

interface Props {
  visible: boolean;
  title: string;
  /** The thing being acted on — shown verbatim so it's unmistakable. */
  subject?: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Themed replacement for `Alert.alert` confirmations.
 *
 * The system alert is the one piece of chrome that ignores the app's look
 * entirely — a white iOS sheet in the middle of a black cockpit. This keeps
 * destructive confirmations inside the same visual language, with the
 * warning stripe carrying the weight instead of a red button alone.
 */
export function ConfirmDialog({
  visible,
  title,
  subject,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const accent = destructive ? palette.saberRed : palette.crawl;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallows taps so pressing the panel doesn't dismiss it. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={[styles.stripe, { backgroundColor: accent }]} />

          <Text style={[styles.title, { color: accent }]}>{title}</Text>

          {subject ? (
            <View style={styles.subjectBox}>
              <Text style={styles.subject} numberOfLines={3}>
                {subject}
              </Text>
            </View>
          ) : null}

          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={onCancel}>
              <Text style={styles.actionText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.action,
                { borderColor: accent, backgroundColor: `${accent}14` },
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.actionText, { color: accent }]}>{confirmLabel}</Text>
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
    ...modalSheet(520),
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    padding: spacing.lg,
    paddingTop: spacing.lg + 2,
    overflow: "hidden",
  },
  stripe: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  title: { ...type.display, fontSize: 15 },
  subjectBox: {
    borderLeftWidth: 2,
    borderLeftColor: palette.border,
    paddingLeft: spacing.sm,
    marginTop: spacing.md,
  },
  subject: { ...type.body, fontSize: 13, color: palette.text, lineHeight: 18 },
  body: {
    ...type.body,
    fontSize: 12,
    color: palette.textDim,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
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
});
