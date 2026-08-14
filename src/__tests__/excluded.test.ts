import { isExcludedIndustry, withoutExcludedIndustries } from "../api/excluded";
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
  postedDate: new Date().toISOString(),
  ...overrides,
});

/**
 * The stakes here are higher than the Star Wars matcher: a bad term doesn't
 * mislabel a card, it deletes postings. The first trap is the one that
 * matters most — nearly every description carries an equal-opportunity
 * statement, so a bare "sex" would empty the board.
 */
describe("isExcludedIndustry", () => {
  describe("keeps ordinary postings", () => {
    it.each([
      [
        "equal-opportunity boilerplate",
        "We do not discriminate based on race, sex, gender identity, sexual orientation or age.",
      ],
      ["adult education", "Adult education programme for adult learners."],
      ["adult social care", "Adult social care services across the region."],
      ["video games", "Gaming industry, AAA games, game engine work."],
      ["calendar slots", "Manage time slots and booking slots for patients."],
      ["stakeholders", "Work with stakeholders on high stakes projects."],
      ["beta testing", "Beta testing between releases for better outcomes."],
      ["patient escort", "Patient escort duties within the ward."],
      ["odds ratios", "Evaluate odds ratios in the study."],
      ["anti-harassment policy", "Enforce our anti sexual harassment policy."],
    ])("%s", (_label, description) => {
      expect(isExcludedIndustry(job({ description }))).toBe(false);
    });
  });

  describe("removes the excluded industries", () => {
    it.each([
      ["casino in the company name", job({ company: "Grand Casino Group" })],
      ["iGaming", job({ description: "Leading iGaming company in Malta" })],
      ["sportsbook", job({ description: "Sportsbook and sports betting platform" })],
      ["poker and roulette", job({ description: "We build poker and roulette games" })],
      ["lottery", job({ company: "National Lottery" })],
      ["pornography", job({ description: "Adult content / porn streaming platform" })],
      ["webcam models", job({ description: "Webcam models platform support" })],
      ["OnlyFans agency", job({ description: "OnlyFans creator management agency" })],
    ])("%s", (_label, posting) => {
      expect(isExcludedIndustry(posting)).toBe(true);
    });
  });

  it("checks tags as well as prose", () => {
    expect(isExcludedIndustry(job({ tags: ["igaming", "backend"] }))).toBe(true);
  });
});

describe("withoutExcludedIndustries", () => {
  it("keeps the clean postings and drops the rest", () => {
    const kept = withoutExcludedIndustries([
      job({ id: "a", title: "Frontend Engineer" }),
      job({ id: "b", company: "Lucky Casino" }),
      job({ id: "c", title: "Backend Engineer" }),
    ]);
    expect(kept.map((j) => j.id)).toEqual(["a", "c"]);
  });
});
