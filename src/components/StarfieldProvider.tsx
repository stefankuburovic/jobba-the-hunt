import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Animated, Easing, StyleSheet } from "react-native";

/** How many independent twinkle phases the stars are shared across. */
export const TWINKLE_GROUPS = 6;

interface StarfieldControls {
  /** 0 = drifting dots, 1 = full hyperspace streaks. */
  warp: Animated.Value;
  /** Shared opacity loops; each star picks one so we run 6 loops, not 70. */
  twinkles: Animated.Value[];
  /** Quick punch into lightspeed and back — used to acknowledge an action. */
  burst: () => void;
  /** Warp out and wash the screen white. Resolves once the screen is white. */
  jumpToLightspeed: () => Promise<void>;
  /** Fades the white away and settles the stars. */
  reset: () => void;
  whiteout: Animated.Value;
}

const StarfieldContext = createContext<StarfieldControls | undefined>(undefined);

export function StarfieldProvider({ children }: { children: React.ReactNode }) {
  const warp = useRef(new Animated.Value(0)).current;
  const whiteout = useRef(new Animated.Value(0)).current;

  // One looping value per group rather than one per star: 70 concurrent
  // loops is a lot of animation nodes for a background decoration.
  const twinkles = useMemo(
    () =>
      Array.from({ length: TWINKLE_GROUPS }, () => new Animated.Value(Math.random())),
    []
  );

  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    twinkles.forEach((value, i) => {
      const duration = 2400 + i * 640;
      const loop = () =>
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.25,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) loop();
        });
      loop();
    });
  }

  const burst = useCallback(() => {
    Animated.sequence([
      Animated.timing(warp, {
        toValue: 1,
        duration: 460,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(warp, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [warp]);

  const jumpToLightspeed = useCallback(
    () =>
      new Promise<void>((resolve) => {
        Animated.sequence([
          Animated.timing(warp, {
            toValue: 1,
            duration: 780,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(whiteout, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => resolve());
      }),
    [warp, whiteout]
  );

  const reset = useCallback(() => {
    Animated.parallel([
      Animated.timing(whiteout, {
        toValue: 0,
        duration: 620,
        useNativeDriver: true,
      }),
      Animated.timing(warp, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [warp, whiteout]);

  const value = useMemo(
    () => ({ warp, twinkles, burst, jumpToLightspeed, reset, whiteout }),
    [warp, twinkles, burst, jumpToLightspeed, reset, whiteout]
  );

  return (
    <StarfieldContext.Provider value={value}>
      {children}
      {/* Sits above the navigator so the wash covers the whole app. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.whiteout, { opacity: whiteout }]}
      />
    </StarfieldContext.Provider>
  );
}

export function useStarfield(): StarfieldControls {
  const ctx = useContext(StarfieldContext);
  if (!ctx) {
    throw new Error("useStarfield must be used within a StarfieldProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  whiteout: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
  },
});
