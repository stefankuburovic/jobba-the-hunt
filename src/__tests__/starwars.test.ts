import { findStarWarsReference, referenceBadge } from "../starwars";

/**
 * The two tiers exist because the franchise shares its vocabulary with
 * ordinary English. These traps are the reason the flat keyword list was
 * abandoned — each one lit up under it.
 */
describe("findStarWarsReference", () => {
  describe("ignores everyday words that merely look like references", () => {
    it.each([
      ["Salesforce", "Salesforce Developer for our CRM team"],
      ["workforce", "Join our growing workforce"],
      ["force multiplier", "You will be a force multiplier for the team"],
      ["Czech Republic", "Position based in Czech Republic, remote friendly"],
      ["headhunter", "No headhunters please"],
      ["Android", "Android developer, Kotlin, Jetpack Compose"],
      ["working solo", "You will work solo on greenfield projects"],
      ["Empire State", "Office near the Empire State Building"],
      ["a company called Rebel", "Rebel Ltd is a fintech company"],
      ["Orlando", "Relocation to Orlando available"],
    ])("%s", (_label, text) => {
      expect(findStarWarsReference(text)).toBeNull();
    });
  });

  describe("catches genuine references", () => {
    it.each([
      ["JavaScript Jedi wanted", "Jedi"],
      ["We need a Padawan to mentor", "Padawan"],
      ["Senior Droid Engineer", "Droid"],
      ["Our CTO is basically Yoda", "Yoda"],
    ])("%s", (text, expected) => {
      expect(findStarWarsReference(text)?.toLowerCase()).toBe(expected.toLowerCase());
    });

    it("matches everyday words inside a giveaway phrase", () => {
      expect(findStarWarsReference("May the force be with you")).not.toBeNull();
      expect(findStarWarsReference("Join the rebel alliance of engineers")).not.toBeNull();
    });
  });

  it("searches every part it is given, not just the first", () => {
    expect(findStarWarsReference("Software Engineer", "We are a team of jedi")).not.toBeNull();
  });

  // The badge names what was found — "JEDI" is the joke, "STAR WARS" isn't.
  it("returns the matched phrase so the badge can name it", () => {
    expect(findStarWarsReference("Sales Jedi")).toBe("Jedi");
  });
});

describe("referenceBadge", () => {
  it("passes short matches through", () => {
    expect(referenceBadge("Jedi")).toBe("Jedi");
  });

  it("truncates long matches to fit a badge", () => {
    const badge = referenceBadge("A long time ago in a galaxy");
    expect(badge.length).toBeLessThanOrEqual(18);
    expect(badge.endsWith("…")).toBe(true);
  });
});
