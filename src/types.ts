/** Boards that publish an open listing of everything they have. */
export type AggregatorSource =
  | "remotive"
  | "arbeitnow"
  | "remoteok"
  | "jobicy"
  | "themuse"
  | "himalayas"
  | "weworkremotely";

/**
 * Greenhouse is per-employer rather than a board, so its source carries the
 * company slug — `greenhouse:stripe` — which also keeps job ids unique
 * across employers.
 */
export type JobSource = AggregatorSource | `greenhouse:${string}`;

export interface Job {
  id: string; // `${source}:${externalId}` — stable, dedupe-safe key
  source: JobSource;
  title: string;
  company: string;
  url: string;
  description: string; // plain text (HTML stripped)
  tags: string[];
  remote: boolean;
  location?: string;
  postedDate: string; // ISO 8601
  salary?: string; // human-readable, when that's all the source gives
  // Numeric pay, when the source publishes it — needed to sort by salary,
  // which a free-text range can't support.
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
}

export type ApplicationStatus =
  | "new"
  | "applied"
  | "in_progress"
  | "interview"
  | "rejected"
  | "offer";

// The stored keys never change — only what the bounty hunter reads on screen.
// Anything already saved to AsyncStorage keeps working.
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "Sighted",
  applied: "Transmitted",
  in_progress: "In Pursuit",
  interview: "Audience",
  rejected: "Carbonite",
  offer: "Bounty Claimed",
};

// Plain-language gloss, shown under the pills so the metaphor never costs
// you clarity about what the status actually means.
export const STATUS_HINTS: Record<ApplicationStatus, string> = {
  new: "Saved, not yet applied",
  applied: "Application sent",
  in_progress: "Screening / take-home",
  interview: "Interview scheduled",
  rejected: "Rejected — frozen out",
  offer: "Offer received",
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "new",
  "applied",
  "in_progress",
  "interview",
  "offer",
  "rejected",
];

// Saber colours carry the meaning: blue neutral, yellow active, purple the
// audience itself, green the win, grey the freeze-out.
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: "#4FC3F7",
  applied: "#22D3EE",
  in_progress: "#FFE81F",
  interview: "#A78BFA",
  rejected: "#8494AC",
  offer: "#4ADE80",
};

export interface Application {
  jobId: string;
  job: Job; // snapshot at save time, so tracker survives feed API changes
  status: ApplicationStatus;
  savedDate: string; // ISO
  appliedDate?: string; // ISO
  interviewDate?: string; // ISO — the scheduled audience
  /** Device calendar event created for `interviewDate`, when sync succeeded. */
  calendarEventId?: string;
  notes?: string;
}
