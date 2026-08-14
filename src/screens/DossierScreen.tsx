import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Starfield } from "../components/Starfield";
import { EMPTY_PROFILE, Profile, useProfile } from "../context/ProfileContext";
import { palette, spacing, type } from "../theme";

interface FieldSpec {
  key: keyof Profile;
  label: string;
  placeholder: string;
  hint?: string;
  multiline?: boolean;
}

const FIELDS: FieldSpec[] = [
  { key: "name", label: "Name", placeholder: "Stefan Kuburović" },
  {
    key: "headline",
    label: "What you are",
    placeholder: "frontend engineer",
    hint: "Goes straight into the letter: “I'm a frontend engineer…”",
  },
  { key: "yearsExperience", label: "Years of experience", placeholder: "6" },
  { key: "city", label: "Based in", placeholder: "Belgrade" },
  {
    key: "skills",
    label: "Skills",
    placeholder: "React, TypeScript, Angular, NestJS",
    hint: "Comma-separated. Only the ones a posting actually mentions get named in the draft.",
    multiline: true,
  },
  {
    key: "highlights",
    label: "One thing you shipped",
    placeholder: "Rebuilt an order flow that cut checkout drop-off by a third.",
    hint: "The part no template can write. What it was, and what changed because of it.",
    multiline: true,
  },
];

/**
 * The details the cover-letter drafts are built from.
 *
 * Without these the generator can only produce the fill-in-the-blanks letter
 * the concept warns about — so the letter screen sends you here first.
 */
export function DossierScreen() {
  const { profile, save } = useProfile();
  const [draft, setDraft] = useState<Profile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const commit = async () => {
    await save(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <View style={styles.container}>
      <Starfield />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Used to draft cover letters. Nothing here leaves your phone.
          </Text>

          {FIELDS.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={[styles.input, field.multiline && styles.inputMultiline]}
                value={draft[field.key]}
                onChangeText={(text) => setDraft((d) => ({ ...d, [field.key]: text }))}
                placeholder={field.placeholder}
                placeholderTextColor={palette.textFaint}
                selectionColor={palette.crawl}
                multiline={field.multiline}
                autoCapitalize={field.key === "skills" ? "none" : "sentences"}
              />
              {field.hint && <Text style={styles.hint}>{field.hint}</Text>}
            </View>
          ))}

          <Pressable style={styles.save} onPress={commit}>
            <Text style={styles.saveText}>{saved ? "Filed ✓" : "File dossier"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.void },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  intro: {
    ...type.body,
    fontSize: 11,
    color: palette.textFaint,
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
  field: { marginBottom: spacing.lg },
  label: { ...type.label, fontSize: 9, color: palette.textFaint, marginBottom: spacing.xs },
  input: {
    ...type.body,
    backgroundColor: palette.panelAltTranslucent,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 3,
    color: palette.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 76, textAlignVertical: "top" },
  hint: {
    ...type.body,
    fontSize: 10,
    color: palette.textFaint,
    marginTop: spacing.xs,
    lineHeight: 14,
  },
  save: {
    borderWidth: 1,
    borderColor: palette.crawl,
    backgroundColor: "rgba(255,232,31,0.08)",
    borderRadius: 3,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  saveText: { ...type.label, fontSize: 12, color: palette.crawl },
});
