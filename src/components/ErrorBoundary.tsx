import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette, spacing, type } from "../theme";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render crash and offers a way back.
 *
 * Without this a single thrown error in any screen unmounts the whole tree
 * and leaves a blank screen with no explanation — the worst possible
 * failure mode, because it looks identical to the app being broken beyond
 * repair. Resetting re-mounts the children, which is usually enough when
 * the cause was one bad row of data.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Kept for the dev console; there's no crash reporter to ship it to.
    console.error("Unhandled render error", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>The hyperdrive's been damaged</Text>
        <Text style={styles.body}>
          Something in the app threw an error. Your saved bounties are on the
          device and untouched.
        </Text>

        <ScrollView style={styles.detailBox}>
          <Text style={styles.detail}>{error.message || String(error)}</Text>
        </ScrollView>

        <Pressable style={styles.action} onPress={this.reset}>
          <Text style={styles.actionText}>Restart systems</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.void,
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: { ...type.display, fontSize: 16, color: palette.crawl },
  body: {
    ...type.body,
    fontSize: 12,
    color: palette.textDim,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  detailBox: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAltTranslucent,
    borderRadius: 3,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  detail: { ...type.body, fontSize: 11, color: palette.saberRed, lineHeight: 16 },
  action: {
    borderWidth: 1,
    borderColor: palette.crawl,
    backgroundColor: "rgba(255,232,31,0.08)",
    borderRadius: 3,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  actionText: { ...type.label, fontSize: 12, color: palette.crawl },
});
