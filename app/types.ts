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
