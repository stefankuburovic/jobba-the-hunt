import { Platform, useWindowDimensions } from "react-native";

/**
 * One place to decide "is this a phone screen or a desktop one".
 *
 * The breakpoints are driven by the job card: below ~760px a second column
 * squeezes the title into four lines, and past ~1600px a fourth column still
 * leaves each card wider than the two-line minimum.
 */
export const BREAKPOINTS = {
  twoColumns: 760,
  threeColumns: 1180,
  fourColumns: 1620,
};

export const SIDEBAR_WIDTH = 232;

/** Widest the content column is allowed to get, grid included. */
export const CONTENT_MAX_WIDTH = 1560;

export interface Layout {
  /** Left navigation instead of a bottom bar. */
  sideNav: boolean;
  /** How many job cards sit in a row. */
  columns: number;
  width: number;
}

export function useLayout(): Layout {
  const { width } = useWindowDimensions();

  // Side navigation is a web idea, and only once there's room for it — a
  // narrow browser window should still behave like the phone layout.
  const sideNav = Platform.OS === "web" && width >= BREAKPOINTS.twoColumns;

  const usable = sideNav ? width - SIDEBAR_WIDTH : width;

  const columns =
    usable >= BREAKPOINTS.fourColumns
      ? 4
      : usable >= BREAKPOINTS.threeColumns
        ? 3
        : usable >= BREAKPOINTS.twoColumns
          ? 2
          : 1;

  return { sideNav, columns, width };
}
