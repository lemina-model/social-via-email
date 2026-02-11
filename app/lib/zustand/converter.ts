import { useAppGlobal } from "./models";
import type { AppGlobal } from "./models";

/**
 * Parses a JSON string and merges it into the store. Session is not in persisted JSON and is never overwritten.
 *
 * @throws SyntaxError if the string is not valid JSON
 */
export function parseAppGlobal(json: string): void {
  const parsed = JSON.parse(json) as Omit<AppGlobal, "session">;
  useAppGlobal.setState({
    othersTimeline: parsed.othersTimeline,
    myTimeline: parsed.myTimeline,
    following: parsed.following,
    followers: parsed.followers,
  });
}

/**
 * Serializes the current store state to a JSON string. Session is not serialized (sensitive data).
 * Only othersTimeline, myTimeline, following, and followers are persisted.
 */
export function stringifyAppGlobal(): string {
  const state = useAppGlobal.getState();
  const stateWithoutSession = {
    othersTimeline: state.othersTimeline,
    myTimeline: state.myTimeline,
    following: state.following,
    followers: state.followers,
  };
  return JSON.stringify(stateWithoutSession);
}
