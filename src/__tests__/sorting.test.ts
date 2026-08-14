import { applyFilters, DEFAULT_FILTERS, salaryLabel, sortJobs } from "../sorting";
import { Job } from "../types";

const job = (overrides: Partial<Job>): Job => ({
  id: "x:1",
  source: "remotive",
  title: "Engineer",
  company: "Acme",
  url: "https://example.com",
  description: "",
  tags: [],
  remote: true,
  postedDate: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("sortJobs", () => {
  const older = job({ id: "older", postedDate: "2025-01-01T00:00:00.000Z" });
  const newer = job({ id: "newer", postedDate: "2026-06-01T00:00:00.000Z" });

  it("puts the freshest first", () => {
    expect(sortJobs([older, newer], "newest").map((j) => j.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("reverses for oldest", () => {
    expect(sortJobs([newer, older], "oldest").map((j) => j.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("does not mutate the input", () => {
    const input = [older, newer];
    sortJobs(input, "newest");
    expect(input.map((j) => j.id)).toEqual(["older", "newer"]);
  });

  // Most postings have no pay at all, so they must not be scattered through
  // the paid ones — they sink, and stay date-ordered among themselves.
  it("ranks by pay and sinks the postings without any", () => {
    const sorted = sortJobs(
      [
        job({ id: "none" }),
        job({ id: "low", salaryMax: 60_000 }),
        job({ id: "high", salaryMax: 200_000 }),
      ],
      "salary"
    );
    expect(sorted.map((j) => j.id)).toEqual(["high", "low", "none"]);
  });

  it("sorts employers alphabetically", () => {
    const sorted = sortJobs(
      [job({ company: "Zebra" }), job({ company: "Acme" })],
      "company"
    );
    expect(sorted.map((j) => j.company)).toEqual(["Acme", "Zebra"]);
  });

  // A bad date from a board must not poison the comparator.
  it("survives an unparseable date", () => {
    const sorted = sortJobs(
      [job({ id: "broken", postedDate: "not-a-date" }), newer],
      "newest"
    );
    expect(sorted.map((j) => j.id)).toEqual(["newer", "broken"]);
  });
});

describe("applyFilters", () => {
  const never = () => false;

  it("passes everything through by default", () => {
    const jobs = [job({ id: "a" }), job({ id: "b" })];
    expect(applyFilters(jobs, DEFAULT_FILTERS, never)).toHaveLength(2);
  });

  it("keeps only remote when asked", () => {
    const jobs = [job({ id: "r" }), job({ id: "onsite", remote: false })];
    const kept = applyFilters(jobs, { ...DEFAULT_FILTERS, remoteOnly: true }, never);
    expect(kept.map((j) => j.id)).toEqual(["r"]);
  });

  it("accepts free-text pay, not just numbers", () => {
    const jobs = [
      job({ id: "text", salary: "$90 - $150 /hour" }),
      job({ id: "numeric", salaryMin: 90_000 }),
      job({ id: "none" }),
    ];
    const kept = applyFilters(jobs, { ...DEFAULT_FILTERS, withSalary: true }, never);
    expect(kept.map((j) => j.id)).toEqual(["text", "numeric"]);
  });

  it("delegates the flagged check to the caller", () => {
    const jobs = [job({ id: "flagged" }), job({ id: "plain" })];
    const kept = applyFilters(
      jobs,
      { ...DEFAULT_FILTERS, flaggedOnly: true },
      (j) => j.id === "flagged"
    );
    expect(kept.map((j) => j.id)).toEqual(["flagged"]);
  });
});

describe("salaryLabel", () => {
  it("shortens a numeric range", () => {
    // The symbol leads the range rather than repeating on both ends.
    expect(salaryLabel(job({ salaryMin: 90_000, salaryMax: 120_000, salaryCurrency: "USD" }))).toBe(
      "$90k–120k"
    );
  });

  it("collapses a range with identical ends", () => {
    expect(salaryLabel(job({ salaryMin: 90_000, salaryMax: 90_000, salaryCurrency: "USD" }))).toBe(
      "$90k"
    );
  });

  it("falls back to the board's own wording", () => {
    expect(salaryLabel(job({ salary: "competitive" }))).toBe("competitive");
  });

  it("returns nothing when there is no pay at all", () => {
    expect(salaryLabel(job({}))).toBeUndefined();
  });
});
