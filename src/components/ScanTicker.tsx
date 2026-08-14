import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { ScanEvent } from "../api";
import { palette, spacing, type } from "../theme";

/**
 * How long each source stays on screen before the next one replaces it.
 * Eight sources at this pace drain in ~1.6s, which is about how long the
 * scan itself takes — so the last board is still readable before the list
 * appears.
 */
const DWELL_MS = 200;

/**
 * Narrates the scan under the loader.
 *
 * The boards are queried in parallel, so several can answer inside the same
 * few milliseconds — without a floor on display time most names would never
 * be readable. So events go into a queue that drains one per `DWELL_MS`:
 * the order is real, the pace is not.
 */
export function useScanTicker() {
  const queue = useRef<ScanEvent[]>([]);
  const draining = useRef(false);
  const [current, setCurrent] = useState<ScanEvent | null>(null);

  const drain = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      draining.current = false;
      return;
    }
    setCurrent(next);
    setTimeout(drain, DWELL_MS);
  }, []);

  const push = useCallback(
    (event: ScanEvent) => {
      queue.current.push(event);
      if (!draining.current) {
        draining.current = true;
        drain();
      }
    },
    [drain]
  );

  const clear = useCallback(() => {
    queue.current = [];
    draining.current = false;
    setCurrent(null);
  }, []);

  return { current, push, clear };
}

export function ScanTicker({ event }: { event: ScanEvent | null }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!event) return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [event, fade]);

  if (!event) {
    return <Text style={styles.placeholder}>Powering up the sensor array…</Text>;
  }

  return (
    <Animated.Text
      style={[
        styles.line,
        !event.ok && styles.lineFailed,
        { opacity: fade },
      ]}
      numberOfLines={1}
    >
      {event.ok
        ? `◂ ${event.label} — ${event.count} signal${event.count === 1 ? "" : "s"}`
        : `◂ ${event.label} — no response`}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  line: {
    ...type.label,
    fontSize: 10,
    color: palette.saberBlue,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  lineFailed: { color: palette.saberRed },
  placeholder: {
    ...type.label,
    fontSize: 10,
    color: palette.textFaint,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
