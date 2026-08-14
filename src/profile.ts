/**
 * The details cover letters are built from.
 *
 * Kept out of the React context on purpose: the letter generator is a pure
 * function and shouldn't drag React and AsyncStorage in behind it — which
 * is exactly what makes it testable in isolation.
 */
export interface Profile {
  name: string;
  /** "Frontend engineer", "Angular developer" — how you introduce yourself. */
  headline: string;
  yearsExperience: string;
  /** Comma-separated; matched against a posting to pick what to mention. */
  skills: string;
  /** One or two concrete things you've shipped. The part that isn't generic. */
  highlights: string;
  city: string;
}

export const EMPTY_PROFILE: Profile = {
  name: "",
  headline: "",
  yearsExperience: "",
  skills: "",
  highlights: "",
  city: "",
};

/** True once there's enough to write a letter that isn't a template. */
export function profileIsUsable(profile: Profile): boolean {
  return Boolean(profile.name.trim() && profile.headline.trim());
}
