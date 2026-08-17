import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { palette, spacing, type } from "../theme";

export interface Notice {
  headline: string;
  detail: string;
  tone?: "info" | "warn";
}

interface NoticeContextValue {
  notify: (notice: Notice) => void;
}

const NoticeContext = createContext<NoticeContextValue | undefined>(undefined);

/**
 * One-button notices, themed.
 *
 * These used to be `Alert.alert`, which react-native-web implements as an
 * empty function — every notice on the web build would have vanished
 * silently, including the one explaining why calendar sync didn't happen.
 * Routing them through the app means they look the same and work the same
 * on every platform.
 */
export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback((next: Notice) => setNotice(next), []);
  const value = useMemo(() => ({ notify }), [notify]);
  const accent = notice?.tone === "warn" ? palette.crawl : palette.saberBlue;

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <Modal
        visible={notice !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setNotice(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setNotice(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={[styles.stripe, { backgroundColor: accent }]} />
            <Text style={[styles.headline, { color: accent }]}>
              {notice?.headline}
            </Text>
            <Text style={styles.detail}>{notice?.detail}</Text>
            <Pressable
              style={[styles.action, { borderColor: accent }]}
              onPress={() => setNotice(null)}
            >
              <Text style={[styles.actionText, { color: accent }]}>Acknowledged</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </NoticeContext.Provider>
  );
}

export function useNotice(): NoticeContextValue {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotice must be used within a NoticeProvider");
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,3,6,0.86)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    padding: spacing.lg,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
  stripe: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  headline: { ...type.display, fontSize: 15 },
  detail: {
    ...type.body,
    fontSize: 12,
    color: palette.textDim,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  action: {
    borderWidth: 1,
    backgroundColor: palette.panelAltTranslucent,
    borderRadius: 3,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  actionText: { ...type.label, fontSize: 11 },
});
