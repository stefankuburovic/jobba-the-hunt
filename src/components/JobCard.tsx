import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { findStarWarsReference, referenceBadge } from "../starwars";
import { Job } from "../types";
import { holoPanel, palette, spacing, type } from "../theme";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

/**
 * A bounty dossier: target (role), employer (company), last known position
 * (location), and the intel scan (description). The lit top edge is what
 * sells it as a projected hologram rather than a flat card.
 */
export function JobCard({ job }: { job: Job }) {
  const reference = useMemo(
    () => findStarWarsReference(job.title, job.description),
    [job.title, job.description]
  );

  return (
    <View style={[styles.card, reference && styles.cardFlagged]}>
      <View style={[styles.topEdge, reference && styles.topEdgeFlagged]} />

      {reference && (
        <View style={styles.refRow}>
          <Text style={styles.refBadge}>★ {referenceBadge(reference)}</Text>
          <Text style={styles.refNote}>one of us</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {job.title}
        </Text>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>{job.source}</Text>
        </View>
      </View>

      <Text style={styles.company}>{job.company}</Text>

      <Text style={styles.meta}>
        {(job.location ?? "Deep space / remote").toUpperCase()} · {timeAgo(job.postedDate)}
        {job.salary ? ` · ${job.salary}` : ""}
      </Text>

      {job.tags.length > 0 && (
        <View style={styles.tagRow}>
          {job.tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.description} numberOfLines={3}>
        {job.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...holoPanel,
    padding: spacing.lg,
    paddingTop: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  // A flagged card trades the blue projector beam for crawl yellow, so it
  // reads as special at a glance while scrolling.
  cardFlagged: {
    borderColor: "rgba(255,232,31,0.55)",
    backgroundColor: "rgba(26,23,10,0.78)",
    shadowColor: palette.crawl,
    shadowOpacity: 0.28,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  refBadge: { ...type.label, fontSize: 9, color: palette.crawl },
  refNote: { ...type.body, fontSize: 9, color: palette.textFaint },
  // The projector beam along the top of the panel.
  topEdge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.saberBlue,
    opacity: 0.55,
  },
  topEdgeFlagged: { backgroundColor: palette.crawl, opacity: 0.9 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  title: {
    ...type.display,
    fontSize: 16,
    letterSpacing: 1.2,
    color: palette.text,
    flex: 1,
  },
  sourceBadge: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panelAlt,
    borderRadius: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  sourceBadgeText: { ...type.label, fontSize: 9, color: palette.saberBlue },
  company: {
    ...type.label,
    fontSize: 13,
    letterSpacing: 1,
    color: palette.crawl,
    marginTop: spacing.xs,
  },
  meta: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
    color: palette.textFaint,
    marginTop: spacing.xs,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  tag: {
    backgroundColor: palette.panelAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { ...type.body, fontSize: 10, color: palette.textDim },
  description: {
    ...type.body,
    fontSize: 13,
    color: palette.textDim,
    marginTop: spacing.md,
    lineHeight: 19,
  },
});
