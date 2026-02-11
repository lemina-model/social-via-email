import { create } from "zustand";

/** Data transfer object for a signed-in author (name + email). */
export type Author = {
  /** The email of the author; serves as the unique identifier. */
  email: string;
  /** The name of the author; for display purposes. */
  name: string;
};

/** A single post in a post tree. */
export type Post = {
  /** Unique id; must be non-null. */
  uuid: string;
  /** Direct parent post id; null for top-level posts. */
  parentUuid: string | null;
  /** Root post id; null for top-level posts. */
  rootUuid: string | null;
  /** Child post ids; may be empty, never null. */
  childUuidList: string[];

  /** Author's email; must be non-null. */
  authorEmail: string;
  /** Author's name; for display purposes. */
  authorName: string;
  /** Creation time in milliseconds (JavaScript Date.now()). */
  timestamp: number;

  /** Post body; text only; must be non-null and non-empty. */
  content: string;
};

export type Thread = {
  /** The root post of the thread. */
  rootPost: Post;
  
  /** The list of authors who are subscribed to the thread. */
  subscriberEmailList: string[];
};

/** Session-scoped data for the currently signed-in author. */
export type Session = {
  /** The current user who is signed in. */
  signedInAuthor: Author | null;
  /** Gmail access token for API calls for the signed-in author. */
  gmailToken: string | null;
  /** After signed in, whether the initial loading process has completed. */
  loadingComplete: boolean;
};

/** Actions that update only session state. Add new setters here when Session gains members. */
export type SessionActions = {
  setSignedInAuthor: (signedInAuthor: Author | null) => void;
  setGmailToken: (gmailToken: string | null) => void;
  setLoadingComplete: (loadingComplete: boolean) => void;
};

export type AppGlobal = {
  /** Session information and its nested actions. */
  session: Session & SessionActions;

  /** The list of threads from the authors the current user is following. */
  othersTimeline: Thread[];

  /** The list of threads from the current user. */
  myTimeline: Thread[];

  /** The list of authors who the signedInAuthor is following. */
  following: Author[];

  /** The list of authors who follow the signedInAuthor. */
  followers: Author[];
};

type AppGlobalActions = {
  setOthersTimeline: (othersTimeline: Thread[]) => void;
  setMyTimeline: (myTimeline: Thread[]) => void;
  setFollowing: (following: Author[]) => void;
  setFollowers: (followers: Author[]) => void;
  signOut: () => void;
};

const initialSessionData: Session = {
  signedInAuthor: null,
  gmailToken: null,
  loadingComplete: false,
};

/** Global application state store using Zustand. */
export const useAppGlobal = create<AppGlobal & AppGlobalActions>()((set) => {
  const sessionActions: SessionActions = {
    setSignedInAuthor: (signedInAuthor: Author | null) =>
      set((state) => ({ session: { ...state.session, signedInAuthor } })),
    setGmailToken: (gmailToken: string | null) =>
      set((state) => ({ session: { ...state.session, gmailToken } })),
    setLoadingComplete: (loadingComplete: boolean) =>
      set((state) => ({ session: { ...state.session, loadingComplete } })),
  };

  return {
    session: { ...initialSessionData, ...sessionActions },
    othersTimeline: [],
    myTimeline: [],
    following: [],
    followers: [],
    setOthersTimeline: (othersTimeline: Thread[]) => set({ othersTimeline }),
    setMyTimeline: (myTimeline: Thread[]) => set({ myTimeline }),
    setFollowing: (following: Author[]) => set({ following }),
    setFollowers: (followers: Author[]) => set({ followers }),
    signOut: () =>
      set({
        session: { ...initialSessionData, ...sessionActions },
        othersTimeline: [],
        myTimeline: [],
        following: [],
        followers: [],
      }),
  };
});
