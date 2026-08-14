import React, { useMemo } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import { TWINKLE_GROUPS, useStarfield } from "./StarfieldProvider";

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
  /** Radial direction away from screen centre, in degrees. */
  angle: number;
  /** How far it flies during the jump — near stars sweep past fastest. */
  travel: number;
  /** How long the streak stretches at full warp. */
  streak: number;
  /** Static brightness, so stars in one twinkle group aren't identical. */
  alpha: number;
  group: number;
}

/**
 * Animated starfield behind every screen.
 *
 * Idle, the stars breathe on six shared twinkle loops. On a warp they
 * stretch into radial streaks and sweep outward from the centre, which is
 * the whole reason each star carries an `angle`: `scaleY` stretches along
 * the element's own axis, so the star is rotated to face outward first and
 * the stretch then runs along its line of travel.
 *
 * Purely decorative and non-interactive, so it never eats a tap meant for
 * the list underneath.
 */
export function Starfield({ count = 70 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const { warp, twinkles } = useStarfield();

  const stars = useMemo<Star[]>(() => {
    const rand = mulberry32(1977); // the year, obviously
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.hypot(cx, cy) || 1;

    return Array.from({ length: count }, (_, i) => {
      const left = rand() * width;
      const top = rand() * height;
      const dx = left - cx;
      const dy = top - cy;
      const dist = Math.hypot(dx, dy);
      // +90° because scaleY stretches vertically; this turns the star so its
      // long axis points away from the centre.
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const depth = dist / maxDist; // 0 at centre, 1 at the corners

      return {
        key: `star-${i}`,
        top,
        left,
        size: rand() < 0.85 ? 1 : 2,
        angle,
        travel: 120 + depth * 520,
        streak: 14 + depth * 46,
        alpha: 0.3 + rand() * 0.7,
        group: i % TWINKLE_GROUPS,
      };
    });
  }, [count, width, height]);

  const cx = width / 2;
  const cy = height / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => {
        const dx = s.left - cx;
        const dy = s.top - cy;
        const len = Math.hypot(dx, dy) || 1;

        return (
          <Animated.View
            key={s.key}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              backgroundColor: `rgba(232,237,245,${s.alpha})`,
              opacity: Animated.multiply(
                twinkles[s.group],
                warp.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] })
              ),
              transform: [
                {
                  translateX: warp.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (dx / len) * s.travel],
                  }),
                },
                {
                  translateY: warp.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (dy / len) * s.travel],
                  }),
                },
                { rotate: `${s.angle}deg` },
                {
                  scaleY: warp.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, s.streak],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
