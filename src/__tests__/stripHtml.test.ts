import { isNetworkError, searchKeywords, stripHtml } from "../api/util";

// The boards disagree about escaping, and the bug this guards against was
// live: tags were stripped before entities were decoded, so escaped markup
// came back as visible text on the card.
describe("stripHtml", () => {
  it("strips real HTML", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("turns list items into bullets", () => {
    expect(stripHtml("<ul><li>One</li><li>Two</li></ul>")).toBe("• One\n• Two");
  });

  it("decodes escaped markup instead of showing it (Arbeitnow)", () => {
    const out = stripHtml("&lt;p&gt;&lt;strong&gt;Location&lt;/strong&gt;: Berlin&lt;/p&gt;");
    expect(out).toBe("Location: Berlin");
    expect(out).not.toContain("<");
  });

  it("handles double-escaped markup (the GitLab card bug)", () => {
    const out = stripHtml(
      "&lt;div class=&amp;quot;content-intro&amp;quot;&gt;&lt;p&gt;GitLab is a platform.&lt;/p&gt;&lt;/div&gt;"
    );
    expect(out).toBe("GitLab is a platform.");
    expect(out).not.toContain("&quot;");
    expect(out).not.toContain("div");
  });

  it("decodes quotes and numeric entities", () => {
    expect(stripHtml("&lt;p&gt;It&#39;s a &quot;test&quot;&lt;/p&gt;")).toBe(
      `It's a "test"`
    );
  });

  it("keeps a literal ampersand", () => {
    expect(stripHtml("<p>R&amp;D team</p>")).toBe("R&D team");
  });

  it("collapses runaway whitespace", () => {
    expect(stripHtml("<p>a</p><p>b</p><p>c</p>")).toBe("a\n\nb\n\nc");
  });

  it("survives empty input", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("isNetworkError", () => {
  it.each([
    ["React Native offline", new TypeError("Network request failed")],
    ["web fetch failure", new TypeError("Failed to fetch")],
    ["DNS failure", new Error("getaddrinfo ENOTFOUND remotive.com")],
  ])("treats %s as a network problem", (_label, err) => {
    expect(isNetworkError(err)).toBe(true);
  });

  // An HTTP error means we reached the board and it answered badly — that's
  // a source outage, and reporting it as "you're offline" blames the phone.
  it("does not treat an HTTP status error as offline", () => {
    expect(isNetworkError(new Error("Remotive API error: 500"))).toBe(false);
  });

  it("ignores non-Error values", () => {
    expect(isNetworkError("boom")).toBe(false);
  });
});

describe("searchKeywords", () => {
  it("splits on commas and whitespace", () => {
    expect(searchKeywords("react, typescript")).toEqual(["react", "typescript"]);
  });

  it("drops single characters", () => {
    expect(searchKeywords("go a b")).toEqual(["go"]);
  });

  it("falls back to defaults when nothing usable is typed", () => {
    expect(searchKeywords("  ").length).toBeGreaterThan(1);
  });
});
