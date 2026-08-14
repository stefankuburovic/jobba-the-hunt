import { Profile } from "./context/ProfileContext";
import { Job } from "./types";

/**
 * Builds a first draft of a cover letter for a specific posting.
 *
 * This deliberately stops short of writing the letter for you. The whole
 * premise of the app is that fill-in-the-blanks applications are exactly
 * what ATS systems and recruiters spot instantly — so the generator does
 * only the mechanical part: it pulls the company, the role and the overlap
 * between your skills and what the posting actually asks for, and leaves an
 * explicit gap where the specific, non-generic paragraph belongs.
 *
 * The output is meant to be edited before it's sent, and says so.
 */

const PLACEHOLDER = "[[ Say something specific about them here — one honest sentence about why this company, not a compliment any company would fit. ]]";

function splitSkills(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/** Skills of yours the posting actually mentions, in the posting's order. */
export function matchedSkills(profile: Profile, job: Job): string[] {
  const haystack = `${job.title} ${job.tags.join(" ")} ${job.description}`.toLowerCase();

  return splitSkills(profile.skills).filter((skill) =>
    haystack.includes(skill.toLowerCase())
  );
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function buildCoverLetter(profile: Profile, job: Job): string {
  const matched = matchedSkills(profile, job);
  const years = profile.yearsExperience.trim();
  const headline = profile.headline.trim() || "developer";

  const intro = years
    ? `I'm a ${headline} with ${years} years of experience`
    : `I'm a ${headline}`;

  const overlap =
    matched.length > 0
      ? `Your posting asks for ${joinList(matched)} — that's the core of what I work with day to day.`
      : `I've read through the role and the work lines up closely with what I do.`;

  const highlights = profile.highlights.trim()
    ? `\n\n${profile.highlights.trim()}`
    : `\n\n[[ Add one concrete thing you shipped that's relevant to this role — what it was, what changed because of it. ]]`;

  const location = profile.city.trim() ? ` I'm based in ${profile.city.trim()}.` : "";

  return [
    `Hello,`,
    ``,
    `I'd like to apply for the ${job.title} role at ${job.company}.`,
    ``,
    `${intro}.${location} ${overlap}${highlights}`,
    ``,
    PLACEHOLDER,
    ``,
    `I'd be glad to talk it through.`,
    ``,
    `Best regards,`,
    profile.name.trim() || "[[ your name ]]",
    ``,
    `---`,
    `Source: ${job.url}`,
  ].join("\n");
}

/** True while the draft still contains a bracket the user has to fill in. */
export function hasPlaceholders(letter: string): boolean {
  return letter.includes("[[");
}
