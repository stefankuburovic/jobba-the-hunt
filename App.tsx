import { DarkTheme, NavigationContainer, Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { OpeningCrawl } from "./src/components/OpeningCrawl";
import { StarfieldProvider } from "./src/components/StarfieldProvider";
import {
  ApplicationsProvider,
  useApplications,
} from "./src/context/ApplicationsContext";
import { ProfileProvider } from "./src/context/ProfileContext";
import { TargetsProvider } from "./src/context/TargetsContext";
import { FeedScreen } from "./src/screens/FeedScreen";
import { DossierScreen } from "./src/screens/DossierScreen";
import { TargetsScreen } from "./src/screens/TargetsScreen";
import { TrackerScreen } from "./src/screens/TrackerScreen";
import { palette, type } from "./src/theme";

const Tab = createBottomTabNavigator();

// Hold the native splash until the saved bounties are read off disk, so the
// app never flashes an empty tracker before hydrating. Rejections are
// ignored: on web there's no native splash to hold.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

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
  return (
    <SafeAreaProvider>
      {/* Outside the providers so a crash while hydrating storage is caught too. */}
      <ErrorBoundary>
        <ApplicationsProvider>
          <ProfileProvider>
            <TargetsProvider>
              <StarfieldProvider>
                <Root />
              </StarfieldProvider>
            </TargetsProvider>
          </ProfileProvider>
        </ApplicationsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

// Split out so it can read the applications context — the splash has to stay
// up until that context finishes loading.
function Root() {
  const { loading } = useApplications();
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  return (
    <>
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
          <Tab.Screen
            name="Marks"
            component={TargetsScreen}
            options={{
              headerTitle: () => (
                <ScreenTitle title="Marks" subtitle="Employers under watch" />
              ),
              tabBarIcon: ({ color }) => <TabGlyph glyph="✦" color={color} />,
            }}
          />
          <Tab.Screen
            name="Dossier"
            component={DossierScreen}
            options={{
              headerTitle: () => (
                <ScreenTitle
                  title="Dossier"
                  subtitle="What the letters are built from"
                />
              ),
              tabBarIcon: ({ color }) => <TabGlyph glyph="▤" color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {!introDone && <OpeningCrawl onDone={() => setIntroDone(true)} />}
    </>
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
