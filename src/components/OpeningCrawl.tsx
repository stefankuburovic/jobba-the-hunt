import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Starfield } from "./Starfield";
import { palette, type } from "../theme";

const CRAWL_MS = 14000;

/**
 * The opening crawl. Plays once on launch, and a tap anywhere skips it —
 * nobody wants to sit through 14 seconds every time they check for jobs.
 */
export function OpeningCrawl({ onDone }: { onDone: () => void }) {
  const { height } = useWindowDimensions();
  const scroll = useRef(new Animated.Value(height)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);

  // Guarded so a tap-to-skip during the last frames can't fire onDone twice.
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(fade, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(onDone);
  };

  useEffect(() => {
    Animated.timing(scroll, {
      toValue: -height * 1.1,
      duration: CRAWL_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished: done }) => {
      if (done) finish();
    });
    // Runs once on mount; `finish` is stable enough for this one-shot intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fade }]}>
      <Starfield count={120} />
      <Pressable style={StyleSheet.absoluteFill} onPress={finish}>
        <View style={styles.stage}>
          <Animated.View
            style={[
              styles.crawl,
              {
                transform: [
                  { perspective: 400 },
                  { rotateX: "55deg" },
                  { translateY: scroll },
                ],
              },
            ]}
          >
            <Text style={styles.episode}>Episode I</Text>
            <Text style={styles.title}>The Job Hunt</Text>
            <Text style={styles.body}>
              It is a period of unemployment. Rebel developers, striking from a
              hidden home office, have won their first victory against the
              evil Applicant Tracking Systems.
              {"\n\n"}
              During the battle, spies managed to steal secret plans to the
              Empire's ultimate weapon, the GENERIC COVER LETTER — a document
              with enough power to destroy an entire career.
              {"\n\n"}
              Pursued by the Empire's recruiters, you race home aboard your
              starship, custodian of the stolen CV that can save your people
              and restore payroll to the galaxy…
            </Text>
          </Animated.View>
        </View>
        <Text style={styles.skip}>Tap to skip</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.void,
    zIndex: 10,
  },
  stage: { flex: 1, overflow: "hidden", justifyContent: "flex-start" },
  crawl: { paddingHorizontal: 28 },
  episode: {
    ...type.display,
    color: palette.crawl,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    ...type.display,
    color: palette.crawl,
    fontSize: 40,
    textAlign: "center",
    marginBottom: 28,
  },
  body: {
    ...type.body,
    color: palette.crawl,
    fontSize: 22,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "justify",
  },
  skip: {
    ...type.label,
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: palette.textFaint,
    fontSize: 11,
  },
});
