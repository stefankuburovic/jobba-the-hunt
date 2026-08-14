import { DarkTheme, NavigationContainer, Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OpeningCrawl } from "./src/components/OpeningCrawl";
import { ApplicationsProvider } from "./src/context/ApplicationsContext";
import { FeedScreen } from "./src/screens/FeedScreen";
import { TrackerScreen } from "./src/screens/TrackerScreen";
import { palette, type } from "./src/theme";

const Tab = createBottomTabNavigator();

// Spread the built-in dark theme so we inherit the `fonts` block React
// Navigation 7 requires, and override only the colours.
const galacticTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.crawl,
    background: palette.void,
    card: palette.panel,
    text: palette.text,
    border: palette.border,
    notification: palette.saberRed,
  },
};

function ScreenTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.headerTitle}>
      <Text style={styles.headerTitleText}>{title}</Text>
      <Text style={styles.headerSubtitleText}>{subtitle}</Text>
    </View>
  );
}

function TabGlyph({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={[styles.tabGlyph, { color }]}>{glyph}</Text>;
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <SafeAreaProvider>
      <ApplicationsProvider>
        <NavigationContainer theme={galacticTheme}>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: palette.panel,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              },
              headerTintColor: palette.crawl,
              headerTitleAlign: "center",
              tabBarStyle: {
                backgroundColor: palette.panel,
                borderTopColor: palette.border,
              },
              tabBarActiveTintColor: palette.crawl,
              tabBarInactiveTintColor: palette.textFaint,
              tabBarLabelStyle: { ...type.label, fontSize: 9 },
            }}
          >
            <Tab.Screen
              name="Bounty Board"
              component={FeedScreen}
              options={{
                headerTitle: () => (
                  <ScreenTitle
                    title="Jobba the Hunt"
                    subtitle="A long time ago in a job market far, far away…"
                  />
                ),
                tabBarIcon: ({ color }) => <TabGlyph glyph="◎" color={color} />,
              }}
            />
            <Tab.Screen
              name="The Hunt"
              component={TrackerScreen}
              options={{
                headerTitle: () => (
                  <ScreenTitle title="Bounty Log" subtitle="Targets under pursuit" />
                ),
                tabBarIcon: ({ color }) => <TabGlyph glyph="▣" color={color} />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>

        {!introDone && <OpeningCrawl onDone={() => setIntroDone(true)} />}
      </ApplicationsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerTitle: { alignItems: "center" },
  headerTitleText: { ...type.display, fontSize: 17, color: palette.crawl },
  headerSubtitleText: {
    ...type.body,
    fontSize: 9,
    color: palette.textFaint,
    marginTop: 2,
  },
  tabGlyph: { fontSize: 18, lineHeight: 22 },
});
