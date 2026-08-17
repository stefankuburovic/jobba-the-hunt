import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SIDEBAR_WIDTH } from "../layout";
import { palette, spacing, type } from "../theme";

const NAV_HINTS: Record<string, string> = {
  "Bounty Board": "Open postings",
  "The Hunt": "Your applications",
  Marks: "Watched employers",
  Dossier: "Letter details",
};

/**
 * Left navigation for the web build.
 *
 * Replaces the bottom tab bar rather than sitting alongside it: a row of
 * icons pinned to the bottom of a browser window is a phone convention that
 * reads as wrong on a desktop, where the whole left edge is available and
 * the product name belongs in the corner.
 */
export function Sidebar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image source={require("../../assets/splash-icon.png")} style={styles.logo} />
        <View style={styles.brandText}>
          <Text style={styles.wordmark}>Jobba</Text>
          <Text style={styles.wordmarkSub}>the Hunt</Text>
        </View>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={styles.navInner}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const icon = options.tabBarIcon?.({
            focused,
            color: focused ? palette.crawl : palette.textFaint,
            size: 18,
          });

          return (
            <Pressable
              key={route.key}
              style={[styles.item, focused && styles.itemActive]}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
            >
              {focused && <View style={styles.activeEdge} />}
              <View style={styles.itemIcon}>{icon}</View>
              <View style={styles.itemText}>
                <Text style={[styles.itemLabel, focused && styles.itemLabelActive]}>
                  {route.name}
                </Text>
                <Text style={styles.itemHint}>{NAV_HINTS[route.name] ?? ""}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.footer}>
        A long time ago in a job market far, far away…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    backgroundColor: palette.panel,
    borderRightWidth: 1,
    borderRightColor: palette.border,
    paddingVertical: spacing.lg,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logo: { width: 38, height: 38, borderRadius: 7 },
  brandText: { gap: 0 },
  wordmark: { ...type.display, fontSize: 17, color: palette.crawl, letterSpacing: 2 },
  wordmarkSub: { ...type.label, fontSize: 9, color: palette.textDim, letterSpacing: 2 },
  nav: { flex: 1 },
  navInner: { gap: spacing.xs },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  itemActive: { backgroundColor: "rgba(255,232,31,0.07)" },
  // A lit edge marks the active screen, echoing the panel beams on the cards.
  activeEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: palette.crawl,
  },
  itemIcon: { width: 22, alignItems: "center" },
  itemText: { flex: 1 },
  itemLabel: { ...type.label, fontSize: 11, color: palette.textDim },
  itemLabelActive: { color: palette.crawl },
  itemHint: { ...type.body, fontSize: 9, color: palette.textFaint, marginTop: 1 },
  footer: {
    ...type.body,
    fontSize: 9,
    color: palette.textFaint,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    lineHeight: 13,
  },
});
