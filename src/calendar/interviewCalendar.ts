import { Platform } from "react-native";

type CalendarModule = typeof import("expo-calendar");

/** How long an interview slot is assumed to run, absent better information. */
const DEFAULT_DURATION_MIN = 60;

/** Nudges before the event: the night before, and an hour ahead. */
const ALARM_OFFSETS_MIN = [-24 * 60, -60];

let cached: CalendarModule | null | undefined;

/**
 * expo-calendar ships no native module in Expo Go, and it's device-only.
 * A top-level import would take the whole app down on launch there, so the
 * module is pulled in lazily and its absence treated as a normal state.
 */
function loadCalendar(): CalendarModule | null {
  if (cached !== undefined) return cached;
  try {
    cached = require("expo-calendar") as CalendarModule;
  } catch {
    cached = null;
  }
  return cached;
}

export type CalendarFailure =
  | "unavailable" // Expo Go, web, or simulator without calendar support
  | "denied" // user said no to the permission prompt
  | "no-writable-calendar"
  | "error";

export type CalendarResult =
  | { ok: true; eventId: string }
  | { ok: false; reason: CalendarFailure; message: string };

export function isCalendarSupported(): boolean {
  return (
    (Platform.OS === "ios" || Platform.OS === "android") && loadCalendar() !== null
  );
}

export const CALENDAR_UNAVAILABLE_HINT =
  "Calendar sync needs a development build — expo-calendar isn't part of Expo Go. " +
  "The interview date is still saved in the tracker.";

/**
 * Creates a device calendar event for an interview.
 *
 * Full (not write-only) permission is requested on purpose: picking a
 * writable calendar means reading the calendar list first, which write-only
 * access doesn't allow.
 */
export async function addInterviewEvent(params: {
  title: string;
  start: Date;
  notes?: string;
  url?: string;
}): Promise<CalendarResult> {
  const Calendar = loadCalendar();
  if (!Calendar || !isCalendarSupported()) {
    return { ok: false, reason: "unavailable", message: CALENDAR_UNAVAILABLE_HINT };
  }

  try {
    const { status } = await Calendar.requestCalendarPermissions();
    if (status !== "granted") {
      return {
        ok: false,
        reason: "denied",
        message: "Calendar permission denied — the date is still saved in the tracker.",
      };
    }

    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    const writable = calendars.filter((c) => c.allowsModifications);
    const target = writable.find((c) => c.isPrimary) ?? writable[0];

    if (!target) {
      return {
        ok: false,
        reason: "no-writable-calendar",
        message: "No writable calendar on this device.",
      };
    }

    const end = new Date(params.start.getTime() + DEFAULT_DURATION_MIN * 60_000);
    const event = await target.createEvent({
      title: params.title,
      startDate: params.start,
      endDate: end,
      notes: params.notes,
      url: params.url,
      alarms: ALARM_OFFSETS_MIN.map((relativeOffset) => ({ relativeOffset })),
    });

    return { ok: true, eventId: event.id };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "";

    // In Expo Go the JS module can import fine and only blow up once it
    // reaches for the native side. Report that as "unavailable" so the user
    // gets the dev-build hint instead of a raw native error string.
    if (/native module|not available|doesn't exist|ExpoCalendar/i.test(detail)) {
      return { ok: false, reason: "unavailable", message: CALENDAR_UNAVAILABLE_HINT };
    }

    return {
      ok: false,
      reason: "error",
      message: detail || "Couldn't reach the calendar.",
    };
  }
}

/**
 * Removes a previously created interview event. Best-effort: the user may
 * have deleted it in the Calendar app already, which is not an error worth
 * reporting back to them.
 */
export async function removeInterviewEvent(eventId: string): Promise<void> {
  const Calendar = loadCalendar();
  if (!Calendar) return;

  try {
    const event = await Calendar.ExpoCalendarEvent.get(eventId);
    await event.delete();
  } catch {
    // Already gone, or permission was revoked — nothing to clean up.
  }
}
