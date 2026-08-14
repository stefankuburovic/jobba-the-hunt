import { buildCoverLetter, hasPlaceholders, matchedSkills } from "../coverLetter";
import { EMPTY_PROFILE, Profile } from "../profile";
import { Job } from "../types";

const profile: Profile = {
  name: "Stefan Kuburović",
  headline: "frontend engineer",
  yearsExperience: "6",
  city: "Belgrade",
  skills: "React, TypeScript, Angular, NestJS, GraphQL",
  highlights: "Rebuilt an order flow that cut checkout drop-off by a third.",
};

const job: Job = {
  id: "remotive:1",
  source: "remotive",
  title: "Senior Frontend Engineer",
  company: "Acme",
  url: "https://example.com/j/1",
  description: "You will work with React and TypeScript. GraphQL a plus.",
  tags: ["react", "typescript"],
  remote: true,
  postedDate: "2026-01-01T00:00:00.000Z",
};

describe("matchedSkills", () => {
  // The point of the whole feature: name what the posting asks for, and
  // stay quiet about the rest. Listing every skill is what makes a letter
  // read as generated.
  it("names only the skills the posting mentions", () => {
    expect(matchedSkills(profile, job)).toEqual(["React", "TypeScript", "GraphQL"]);
  });

  it("leaves out skills the posting never asks for", () => {
    const matched = matchedSkills(profile, job);
    expect(matched).not.toContain("Angular");
    expect(matched).not.toContain("NestJS");
  });

  it("returns nothing for an empty profile", () => {
    expect(matchedSkills(EMPTY_PROFILE, job)).toEqual([]);
  });
});

describe("buildCoverLetter", () => {
  const letter = buildCoverLetter(profile, job);

  it("addresses the actual role and employer", () => {
    expect(letter).toContain("Senior Frontend Engineer");
    expect(letter).toContain("Acme");
  });

  it("uses the profile rather than filler", () => {
    expect(letter).toContain("Stefan Kuburović");
    expect(letter).toContain("6 years");
    expect(letter).toContain("Belgrade");
  });

  it("links back to the posting", () => {
    expect(letter).toContain(job.url);
  });

  // Deliberate: the app exists because fill-in-the-blanks applications get
  // screened out, so the draft must never look finished.
  it("always leaves a gap for the part worth writing yourself", () => {
    expect(hasPlaceholders(letter)).toBe(true);
  });

  it("asks for a highlight when the profile has none", () => {
    const thin = buildCoverLetter({ ...profile, highlights: "" }, job);
    expect(thin).toContain("[[");
    expect(hasPlaceholders(thin)).toBe(true);
  });

  it("still produces something usable from an empty profile", () => {
    const letter = buildCoverLetter(EMPTY_PROFILE, job);
    expect(letter).toContain("Acme");
    expect(letter).toContain("[[ your name ]]");
  });

  it("omits the years clause when experience is blank", () => {
    expect(buildCoverLetter({ ...profile, yearsExperience: "" }, job)).not.toContain(
      "years of experience"
    );
  });
});
