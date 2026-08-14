import * as Clipboard from "expo-clipboard";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { buildCoverLetter, hasPlaceholders, matchedSkills } from "../coverLetter";
import { useProfile } from "../context/ProfileContext";
import { palette, spacing, type } from "../theme";
import { Job } from "../types";

interface Props {
  visible: boolean;
  job: Job;
  onClose: () => void;
}

/**
 * A cover-letter draft for one posting.
 *
 * The text is editable in place and ships with bracketed gaps rather than
 * filler: a letter that reads as generated is worse than no letter, and the
 * banner says so instead of quietly implying the draft is ready to send.
 */
export function CoverLetterModal({ visible, job, onClose }: Props) {
  const { profile, isUsable } = useProfile();

  const generated = useMemo(
    () => buildCoverLetter(profile, job),
    [profile, job]
  );
  const matched = useMemo(() => matchedSkills(profile, job), [profile, job]);

  const [letter, setLetter] = useState(generated);
  const [copied, setCopied] = useState(false);

  // Regenerating on open keeps the draft in step with a profile edited since.
  const [seed, setSeed] = useState(generated);
  if (seed !== generated) {
    setSeed(generated);
    setLetter(generated);
  }

  const copy = async () => {
    await Clipboard.setStringAsync(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.sheetWrap}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.stripe} />
            <Text style={styles.title}>Draft transmission</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {job.title} @ {job.company}
            </Text>

            {!isUsable ? (
              <Text style={styles.warn}>
                Fill in the Dossier tab first — without a name and a headline this
                is just a template, which is exactly what recruiters screen out.
              </Text>
            ) : matched.length > 0 ? (
              <Text style={styles.matched}>
                Matched from your dossier: {matched.join(", ")}
              </Text>
            ) : (
              <Text style={styles.matched}>
                None of your listed skills appear in this posting — worth a read
                before you send anything.
              </Text>
            )}

            <ScrollView style={styles.editorWrap} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.editor}
                value={letter}
                onChangeText={setLetter}
                multiline
                selectionColor={palette.crawl}
              />
            </ScrollView>

            {hasPlaceholders(letter) && (
              <Text style={styles.placeholderWarn}>
                Still has [[ gaps ]] to fill — that's the part worth writing yourself.
              </Text>
            )}

            <View style={styles.actions}>
              <Pressable style={styles.action} onPress={onClose}>
                <Text style={styles.actionText}>Close</Text>
              </Pressable>
              <Pressable
                style={styles.action}
                onPress={() => Share.share({ message: letter })}
              >
                <Text style={styles.actionText}>Share</Text>
              </Pressable>
              <Pressable style={[styles.action, styles.copy]} onPress={copy}>
                <Text style={[styles.actionText, styles.copyText]}>
                  {copied ? "Copied ✓" : "Copy"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,3,6,0.88)",
    justifyContent: "center",
  },
  sheetWrap: { padding: spacing.md },
  sheet: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    padding: spacing.lg,
    maxHeight: "92%",
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.crawl,
  },
  title: { ...type.display, fontSize: 15, color: palette.crawl },
  subtitle: {
    ...type.body,
    fontSize: 12,
    color: palette.textDim,
    marginTop: spacing.xs,
  },
  warn: {
    ...type.body,
    fontSize: 11,
    color: palette.crawl,
    marginTop: spacing.md,
    lineHeight: 16,
  },
  matched: {
    ...type.body,
    fontSize: 11,
    color: palette.saberGreen,
    marginTop: spacing.md,
    lineHeight: 16,
  },
  editorWrap: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 3,
    backgroundColor: palette.panelAltTranslucent,
    maxHeight: 340,
  },
  editor: {
    ...type.body,
    color: palette.text,
    fontSize: 13,
    lineHeight: 20,
    padding: spacing.md,
    minHeight: 240,
    textAlignVertical: "top",
  },
  placeholderWarn: {
    ...type.body,
    fontSize: 10,
    color: palette.textFaint,
    marginTop: spacing.sm,
  },
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
  copy: { borderColor: palette.crawl, backgroundColor: "rgba(255,232,31,0.08)" },
  copyText: { color: palette.crawl },
});
