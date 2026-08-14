import React, { useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { palette } from "../theme";

// Deterministic PRNG — a fixed seed means the stars sit still across
// re-renders instead of twitching to new positions on every state change.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  key: string;
  top: number;
  left: number;
  size: number;
  opacity: number;
}

/**
 * Static starfield painted behind every screen. Purely decorative and
 * non-interactive (`pointerEvents="none"`), so it never eats a tap meant for
 * the list underneath.
 */
export function Starfield({ count = 70 }: { count?: number }) {
  const { width, height } = useWindowDimensions();

  const stars = useMemo<Star[]>(() => {
    const rand = mulberry32(1977); // the year, obviously
    return Array.from({ length: count }, (_, i) => ({
      key: `star-${i}`,
      top: rand() * height,
      left: rand() * width,
      size: rand() < 0.85 ? 1 : 2, // a few brighter ones for depth
      opacity: 0.15 + rand() * 0.5,
    }));
  }, [count, width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => (
        <View
          key={s.key}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: palette.text,
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
}
