import { Job } from "../types";
import { stripHtml } from "./util";

// RSS, not JSON: https://weworkremotely.com/categories/*.rss
// React Native has no DOMParser, and pulling in an XML library for one
// small feed isn't worth it — the feed's shape is fixed and shallow, so a
// tag-scoped regex read is enough. Values arrive HTML-escaped, which
// stripHtml already handles.
const FEEDS = [
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
];

function tagValue(item: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(item);
  if (!match) return "";
  // RSS commonly wraps values in CDATA; unwrap before anything else reads it.
  return match[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1").trim();
}

async function fetchFeed(url: string): Promise<Job[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`We Work Remotely feed error: ${res.status}`);
  }

  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return items
    .map((item): Job | null => {
      const rawTitle = tagValue(item, "title");
      const link = tagValue(item, "link");
      if (!rawTitle || !link) return null;

      // WWR formats titles as "Company: Position".
      const split = rawTitle.indexOf(":");
      const company = split > 0 ? rawTitle.slice(0, split).trim() : "Unknown";
      const title = split > 0 ? rawTitle.slice(split + 1).trim() : rawTitle;

      const pubDate = tagValue(item, "pubDate");
      const parsed = pubDate ? new Date(pubDate) : new Date();

      return {
        id: `weworkremotely:${link}`,
        source: "weworkremotely" as const,
        title,
        company,
        url: link,
        description: stripHtml(tagValue(item, "description")),
        tags: tagValue(item, "category")
          .split(/\s*,\s*/)
          .filter(Boolean),
        remote: true,
        location: tagValue(item, "region") || "Remote",
        postedDate: (Number.isNaN(parsed.getTime()) ? new Date() : parsed).toISOString(),
      };
    })
    .filter((j): j is Job => j !== null);
}

export async function fetchWeWorkRemotelyJobs(): Promise<Job[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const jobs = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Both feeds can carry the same posting; the link is the natural key.
  const seen = new Set<string>();
  return jobs.filter((j) => (seen.has(j.id) ? false : (seen.add(j.id), true)));
}
