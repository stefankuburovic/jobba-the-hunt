import { AggregatorSource, JobSource } from "../types";

interface SourceInfo {
  /** Exactly how the board wants to be named. */
  label: string;
  /** Where "who is this?" leads. */
  homepage: string;
  /**
   * Set when the board's terms require visible credit. Rendered in the feed
   * footer, not buried in a settings screen.
   */
  attribution?: string;
}

export const SOURCES: Record<AggregatorSource, SourceInfo> = {
  remotive: { label: "Remotive", homepage: "https://remotive.com" },
  arbeitnow: { label: "Arbeitnow", homepage: "https://www.arbeitnow.com" },
  remoteok: {
    label: "Remote OK",
    homepage: "https://remoteok.com",
    // Their API terms: link back to the Remote OK URL and name Remote OK as
    // a source. Also "don't use the Remote OK logo... please DO use our
    // name" — so this is text only, never their mark.
    attribution: "Jobs marked Remote OK are sourced from Remote OK.",
  },
  jobicy: { label: "Jobicy", homepage: "https://jobicy.com" },
  themuse: { label: "The Muse", homepage: "https://www.themuse.com" },
  himalayas: { label: "Himalayas", homepage: "https://himalayas.app" },
  weworkremotely: {
    label: "We Work Remotely",
    homepage: "https://weworkremotely.com",
  },
};

export function isGreenhouse(source: JobSource): boolean {
  return source.startsWith("greenhouse:");
}

/** Human-readable name for a source, including per-company Greenhouse ones. */
export function sourceLabel(source: JobSource): string {
  if (isGreenhouse(source)) {
    const slug = source.slice("greenhouse:".length);
    return slug.replace(/[-_]/g, " ");
  }
  return SOURCES[source as AggregatorSource]?.label ?? source;
}

export function sourceHomepage(source: JobSource): string | undefined {
  if (isGreenhouse(source)) return undefined;
  return SOURCES[source as AggregatorSource]?.homepage;
}

/** Every credit line that must stay visible somewhere in the UI. */
export function requiredAttributions(): string[] {
  return Object.values(SOURCES)
    .map((s) => s.attribution)
    .filter((a): a is string => Boolean(a));
}
