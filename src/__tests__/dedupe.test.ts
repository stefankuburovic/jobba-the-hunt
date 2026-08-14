import { dedupePostings, postingKey } from "../dedupe";
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

describe("postingKey", () => {
  it("ignores punctuation and case", () => {
    expect(postingKey(job({ company: "Acme, Inc.", title: "Data Analyst" }))).toBe(
      postingKey(job({ company: "acme inc", title: "data analyst" }))
    );
  });

  it("ignores seniority decoration", () => {
    expect(postingKey(job({ title: "Senior Data Analyst" }))).toBe(
      postingKey(job({ title: "Data Analyst" }))
    );
  });

  it("ignores remote and gender markers employers vary between copies", () => {
    expect(postingKey(job({ title: "Data Analyst (Remote)" }))).toBe(
      postingKey(job({ title: "Data Analyst (m/w/d)" }))
    );
  });

  it("still separates genuinely different roles", () => {
    expect(postingKey(job({ title: "Data Analyst" }))).not.toBe(
      postingKey(job({ title: "Data Engineer" }))
    );
  });

  it("still separates the same role at different employers", () => {
    expect(postingKey(job({ company: "Acme" }))).not.toBe(
      postingKey(job({ company: "Globex" }))
    );
  });
});

describe("dedupePostings", () => {
  it("keeps the first copy and drops the repeats", () => {
    const kept = dedupePostings([
      job({ id: "a", title: "Regional Threat Assessment Manager" }),
      job({ id: "b", title: "Regional Threat Assessment Manager" }),
      job({ id: "c", title: "Regional Threat Assessment Manager" }),
    ]);
    expect(kept.map((j) => j.id)).toEqual(["a"]);
  });

  it("collapses repeats that came from different boards", () => {
    const kept = dedupePostings([
      job({ id: "remoteok:1", source: "remoteok" }),
      job({ id: "jobicy:1", source: "jobicy" }),
    ]);
    expect(kept).toHaveLength(1);
  });

  it("carries the seen set across batches", () => {
    const seen = new Set<string>();
    dedupePostings([job({ id: "first" })], seen);
    expect(dedupePostings([job({ id: "second" })], seen)).toHaveLength(0);
  });

  it("leaves genuinely distinct postings alone", () => {
    const kept = dedupePostings([
      job({ id: "a", title: "Frontend Engineer" }),
      job({ id: "b", title: "Backend Engineer" }),
      job({ id: "c", company: "Globex", title: "Frontend Engineer" }),
    ]);
    expect(kept).toHaveLength(3);
  });
});
