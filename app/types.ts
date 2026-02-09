import { create } from "zustand";

/** Data transfer object for a signed-in person (name + email). */
export type Person = {
  name: string;
  email: string;
};

/** A single post in the thread. */
export type Post = {
  /** Unique id; must be non-null. */
  uuid: string;
  /** Parent post id; null for top-level posts. */
  parentUuid: string | null;
  /** Child post ids; may be empty, never null. */
  childUuidList: string[];
  /** Post body; must be non-null and non-empty. */
  content: string;
  /** Author's email; must be non-null. */
  authorEmail: string;
  /** Creation time in milliseconds (JavaScript Date.now()). */
  timestamp: number;
  /** Human-readable time for display; derived from timestamp, can be recalculated. */
  timestampDisplay: string;
};

export type AppGlobal = {
  /** The current user who is signed in. */
  whoami: Person | null;
  /** Gmail access token for API calls. */
  gmailToken: string | null;
  /** After signed in, Whether the loading process has completed. */
  loadingComplete: boolean;
  /** The list of posts from the people the current user is following. */
  compositeTimeline: Post[];
  /** The list of posts from a certain given person. */
  timelineLookup: Post[];
  /** The list of posts from the current user. */
  myTimeline: Post[];
  /** The list of people who the current user is following. */
  following: Person[];
  /** The list of people who follow the current user. */
  followers: Person[];
};

type AppGlobalActions = {
  setWhoami: (whoami: Person | null) => void;
  setGmailToken: (gmailToken: string | null) => void;
  setLoadingComplete: (loadingComplete: boolean) => void;
  setCompositeTimeline: (compositeTimeline: Post[]) => void;
  setTimelineLookup: (timelineLookup: Post[]) => void;
  setMyTimeline: (myTimeline: Post[]) => void;
  setFollowing: (following: Person[]) => void;
  setFollowers: (followers: Person[]) => void;
  signOut: () => void;
};

/** Global application state store using Zustand. */
export const useAppGlobal = create<AppGlobal & AppGlobalActions>()((set) => ({
  whoami: null,
  gmailToken: null,
  loadingComplete: false,
  compositeTimeline: [],
  timelineLookup: [],
  myTimeline: [],
  following: [],
  followers: [],
  // Actions
  setWhoami: (whoami: Person | null) => set({ whoami }),
  setGmailToken: (gmailToken: string | null) => set({ gmailToken }),
  setLoadingComplete: (loadingComplete: boolean) => set({ loadingComplete }),
  setCompositeTimeline: (compositeTimeline: Post[]) => set({ compositeTimeline }),
  setTimelineLookup: (timelineLookup: Post[]) => set({ timelineLookup }),
  setMyTimeline: (myTimeline: Post[]) => set({ myTimeline }),
  setFollowing: (following: Person[]) => set({ following }),
  setFollowers: (followers: Person[]) => set({ followers }),
  signOut: () => set({
    whoami: null,
    gmailToken: null,
    loadingComplete: false,
    compositeTimeline: [],
    timelineLookup: [],
    myTimeline: [],
    following: [],
    followers: [],
  }),
}));
