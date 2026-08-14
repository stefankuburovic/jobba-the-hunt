/**
 * Every failure the user can actually see, in one place.
 *
 * Each entry pairs a themed headline with a plain `detail` line that says
 * what literally happened. The joke is never allowed to be the only
 * information — if a scan came back empty you still need to know whether the
 * board was down, throttling, or simply had no matches.
 */

export type FailureKind =
  | "offline"
  | "source_down"
  | "rate_limited"
  | "no_results"
  | "link_failed"
  | "calendar_unavailable"
  | "calendar_denied"
  | "calendar_no_writable"
  | "calendar_error";

export interface FailureMessage {
  headline: string;
  detail: string;
}

const MESSAGES: Record<FailureKind, FailureMessage> = {
  offline: {
    headline: "The comms are jammed",
    detail: "No connection — check your network and scan again.",
  },
  source_down: {
    headline: "We've lost transmission",
    detail: "A job board didn't answer. Showing what the others returned.",
  },
  rate_limited: {
    headline: "The Hutts don't like being rushed",
    detail: "The board is rate-limiting us. Wait a moment, then resume.",
  },
  no_results: {
    headline: "These aren't the jobs you're looking for",
    detail: "Nothing matched that scan. Try a different term.",
  },
  link_failed: {
    headline: "This posting is in another system",
    detail: "Couldn't open the link on this device.",
  },
  calendar_unavailable: {
    headline: "This astromech isn't rated for that",
    detail:
      "Calendar sync needs a development build — it isn't part of Expo Go. " +
      "The date is still saved in the tracker.",
  },
  calendar_denied: {
    headline: "Access denied by the council",
    detail: "Calendar permission was refused. The date is still in the tracker.",
  },
  calendar_no_writable: {
    headline: "No hangar bay available",
    detail: "This device has no calendar that allows new events.",
  },
  calendar_error: {
    headline: "The archives are incomplete",
    detail: "The calendar couldn't be reached.",
  },
};

export function failureMessage(kind: FailureKind): FailureMessage {
  return MESSAGES[kind];
}

/**
 * Renders a failure as one line for a banner or footer. `extra` carries
 * source names or a raw error string when there's something concrete to add.
 */
export function failureLine(kind: FailureKind, extra?: string): string {
  const { headline, detail } = MESSAGES[kind];
  return extra ? `${headline} — ${extra}` : `${headline} — ${detail}`;
}
