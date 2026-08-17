import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Starfield } from "../components/Starfield";
import { useTargets } from "../context/TargetsContext";
import { contentColumn, palette, spacing, type } from "../theme";

// Well-known boards, offered as a starting point rather than added for you.
const SUGGESTIONS = ["stripe", "gitlab", "figma", "duolingo", "vercel"];

/**
 * Phase 4: the employers whose Greenhouse boards feed the Bounty Board.
 *
 * Greenhouse is per-company rather than a job board, so this is where you
 * name the companies you're actually chasing. Their postings then arrive in
 * the feed alongside the public boards.
 */
export function TargetsScreen() {
  const { targets, addTarget, removeTarget } = useTargets();
  const [draft, setDraft] = useState("");

  const submit = async () => {
    await addTarget(draft);
    setDraft("");
  };

  return (
    <View style={styles.container}>
      <Starfield />

      <View style={styles.addBar}>
        <Text style={styles.label}>Add a Greenhouse board</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submit}
            placeholder="stripe"
            placeholderTextColor={palette.textFaint}
            selectionColor={palette.crawl}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Pressable style={styles.addButton} onPress={submit}>
            <Text style={styles.addButtonText}>Mark</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          The slug from the company's board URL —{" "}
          <Text style={styles.hintStrong}>boards.greenhouse.io/stripe</Text> → stripe.
          Pasting the whole URL works too.
        </Text>
      </View>

      <FlatList
        data={targets}
        keyExtractor={(t) => t}
        contentContainerStyle={[{ paddingBottom: spacing.xl }, contentColumn]}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyHeadline}>No marks yet</Text>
            <Text style={styles.empty}>
              Public boards show whoever is hiring. Marks let you watch specific
              employers — their roles land in the feed even when no board lists them.
            </Text>
            <Text style={styles.suggestLabel}>Try one</Text>
            <View style={styles.suggestRow}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggest} onPress={() => addTarget(s)}>
                  <Text style={styles.suggestText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.slug}>{item}</Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(`https://boards.greenhouse.io/${item}`)
                }
              >
                <Text style={styles.rowLink}>boards.greenhouse.io/{item} ↗</Text>
              </Pressable>
            </View>
            <Pressable hitSlop={10} onPress={() => removeTarget(item)}>
              <Text style={styles.remove}>Release</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.void },
  addBar: {
    ...contentColumn,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: "rgba(14,19,28,0.85)",
  },
  label: { ...type.label, fontSize: 9, color: palette.textFaint, marginBottom: spacing.xs },
  inputRow: { flexDirection: "row", gap: spacing.sm },
  input: {
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
  addButton: {
    borderWidth: 1,
    borderColor: palette.crawl,
    borderRadius: 3,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  addButtonText: { ...type.label, fontSize: 12, color: palette.crawl },
  hint: {
    ...type.body,
    fontSize: 10,
    color: palette.textFaint,
    marginTop: spacing.sm,
    lineHeight: 15,
  },
  hintStrong: { color: palette.textDim },
  emptyBox: { marginTop: 48, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyHeadline: { ...type.display, fontSize: 14, color: palette.crawl, textAlign: "center" },
  empty: {
    ...type.body,
    fontSize: 12,
    color: palette.textDim,
    textAlign: "center",
    lineHeight: 19,
  },
  suggestLabel: {
    ...type.label,
    fontSize: 9,
    color: palette.textFaint,
    textAlign: "center",
    marginTop: spacing.md,
  },
  suggestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  suggest: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAltTranslucent,
    borderRadius: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  suggestText: { ...type.label, fontSize: 10, color: palette.saberBlue },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelTranslucent,
    borderRadius: 3,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  rowMain: { flex: 1, gap: 2 },
  slug: { ...type.display, fontSize: 14, color: palette.text, letterSpacing: 1.5 },
  rowLink: { ...type.body, fontSize: 10, color: palette.textFaint },
  remove: { ...type.label, fontSize: 10, color: palette.saberRed },
});
