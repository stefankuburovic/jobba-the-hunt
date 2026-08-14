import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "jobba:profile";

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

interface ProfileContextValue {
  profile: Profile;
  loading: boolean;
  /** True once there's enough to write a letter that isn't a template. */
  isUsable: boolean;
  save: (profile: Profile) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function profileIsUsable(profile: Profile): boolean {
  return Boolean(profile.name.trim() && profile.headline.trim());
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          setProfile({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
        } catch {
          // Corrupt profile: fall back to empty rather than blocking launch.
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: Profile) => {
    setProfile(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return (
    <ProfileContext.Provider
      value={{ profile, loading, isUsable: profileIsUsable(profile), save }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
