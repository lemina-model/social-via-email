"use client";

import Script from "next/script";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { APP_KEYWORD, REPO_OF_PEOPLE, REPO_OF_POSTS } from "../constants";
import { useAppGlobal, type Person, type Post } from "../types";
import { readEmail, writeEmail } from "../utils/EmailFile";

export type LogFn = (message: string) => void;

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify https://mail.google.com/";
const GMAIL_LABELS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/labels";

type OperationFn = (log: LogFn, accessToken: string) => Promise<void>;

/** Create a new directory (Gmail label) for the app if it does not exist. */
async function createAppLabelOperation(
  log: LogFn,
  accessToken: string
): Promise<void> {
  const opName = `Creating a new directory named "${APP_KEYWORD}"`;
  log(opName);

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const listRes = await fetch(GMAIL_LABELS_URL, { headers: authHeader });
  if (!listRes.ok) {
    log(`Failed to list labels: ${listRes.status}`);
    return;
  }

  const listData = (await listRes.json()) as { labels?: Array<{ name: string }> };
  const labels = listData.labels ?? [];
  const exists = labels.some((l) => l.name === APP_KEYWORD);
  if (exists) {
    log(`Directory "${APP_KEYWORD}" already exists.`);
    return;
  }

  const createRes = await fetch(GMAIL_LABELS_URL, {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ name: APP_KEYWORD }),
  });
  if (!createRes.ok) {
    log(`Failed to create label: ${createRes.status}`);
    return;
  }
  log(`Created label "${APP_KEYWORD}".`);
}

/** Read the post-repository email and process its content. */
async function readPostRepositoryOperation(
  log: LogFn,
  accessToken: string
): Promise<void> {
  log(`Reading the email with the subject "${REPO_OF_POSTS}"`);

  const content = await readEmail(REPO_OF_POSTS, accessToken);
  if (content === null) {
    log(`The email with the subject "${REPO_OF_POSTS}" was not found`);

    await writeEmail(REPO_OF_POSTS, "[]", accessToken);

    log(`Created the email with the subject "${REPO_OF_POSTS}"`);
  } else {
    log("Processing the content of the email");

    const myEmail = useAppGlobal.getState().whoami?.email;
    const postList = JSON.parse(content) as Post[];

    useAppGlobal.getState().setAllPosts(postList ?? []);
    useAppGlobal.getState().setMyTimeline(postList.filter((p) => p.authorEmail === myEmail && p.parentUuid === null) ?? []);
    useAppGlobal.getState().setCompositeTimeline(postList.filter((p) => p.authorEmail !== myEmail && p.parentUuid === null) ?? []);

    log(`Loaded ${postList.length} posts`);
  }
}

/** Read the people-repository email and process its content. */
async function readPeopleRepositoryOperation(
  log: LogFn,
  accessToken: string
): Promise<void> {
  log(`Reading the email with the subject "${REPO_OF_PEOPLE}"`);

  const content = await readEmail(REPO_OF_PEOPLE, accessToken);
  if (content === null) {
    log(`The email with the subject "${REPO_OF_PEOPLE}" was not found`);

    await writeEmail(
      REPO_OF_PEOPLE,
      JSON.stringify({ following: [], followers: [] }),
      accessToken
    );

    log(`Created the email with the subject "${REPO_OF_PEOPLE}"`);
  } else {
    log("Processing the content of the email");

    const peopleMap = JSON.parse(content) as { following?: Person[]; followers?: Person[] };
    const following = peopleMap.following ?? [];
    const followers = peopleMap.followers ?? [];

    useAppGlobal.getState().setFollowing(following);
    useAppGlobal.getState().setFollowers(followers);

    log(`Loaded ${following.length} following and ${followers.length} followers`);
  }
}

const INIT_OPERATIONS: OperationFn[] = [
  createAppLabelOperation,
  readPeopleRepositoryOperation,
  readPostRepositoryOperation,
];

const GAPI_WAIT_MS = 8000;
const TOKEN_REQUEST_TIMEOUT_MS = 15000;

type GapiOAuth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (res: { access_token?: string; error?: string }) => void;
  }) => { requestAccessToken: () => void };
};

function getGoogleOAuth2(): GapiOAuth2 | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { google?: { accounts?: { oauth2?: GapiOAuth2 } } };
  return w.google?.accounts?.oauth2 ?? null;
}

function waitForGapi(): Promise<void> {
  return new Promise((resolve) => {
    if (getGoogleOAuth2()) {
      resolve();
      return;
    }
    const deadline = Date.now() + GAPI_WAIT_MS;
    const t = setInterval(() => {
      if (getGoogleOAuth2() || Date.now() >= deadline) {
        clearInterval(t);
        resolve();
      }
    }, 150);
  });
}

function requestGmailToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const done = (value: string | null) => {
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => done(null), TOKEN_REQUEST_TIMEOUT_MS);

    const g = getGoogleOAuth2();
    if (!g?.initTokenClient) {
      done(null);
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      done(null);
      return;
    }
    const tokenClient = g.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SCOPE,
      callback: (res) => {
        if (res.error) done(null);
        else done(res.access_token ?? null);
      },
    });
    tokenClient.requestAccessToken();
  });
}

async function runOperations(
  log: LogFn,
  accessToken: string
): Promise<void> {
  for (const op of INIT_OPERATIONS) {
    log("");
    await op(log, accessToken);
  }
}


export default function LoadingPage() {
  const router = useRouter();
  const person = useAppGlobal((state) => state.whoami);
  const setGmailToken = useAppGlobal((state) => state.setGmailToken);
  const setLoadingComplete = useAppGlobal((state) => state.setLoadingComplete);
  const [logs, setLogs] = useState<string[]>([]);
  const [operationsComplete, setOperationsComplete] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!person) {
      router.replace("/");
      return;
    }

    // Prevent double execution (e.g., from React Strict Mode)
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    let cancelled = false;

    const log: LogFn = (message: string) => {
      setLogs((prev) => [...prev, message]);
    };

    log("Starting loading…");

    const tokenPromise = (() => {
      // Use token from Zustand store if available
      const stored = useAppGlobal.getState().gmailToken;
      if (stored) return Promise.resolve(stored);
      // Otherwise request a new token and store it
      return waitForGapi()
        .then(() => requestGmailToken())
        .then((token) => {
          if (token) {
            setGmailToken(token);
          }
          return token;
        });
    })();

    tokenPromise
      .then((token) => {
        if (token === null) {
          log("Not signed in: no Gmail access token. No operations performed.");
          return;
        }
        return runOperations(log, token);
      })
      .then(() => {
        setOperationsComplete(true);
      })
      .catch(() => {
        log("Error during loading.");
        setOperationsComplete(true);
      });

    return () => {
      cancelled = true;
    };
  }, [person, router, setGmailToken]);

  const handleContinue = () => {
    setLoadingComplete(true);
    router.push("/following-timeline");
  };

  if (!person) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Loading ...</h1>
      </header>
      <div className="px-6 py-6 text-left">
        <pre className="min-h-[10rem] font-mono text-sm text-foreground whitespace-pre-wrap break-words">
          {logs.length === 0 ? "" : logs.join("\n")}
        </pre>
        {operationsComplete && (
          <div className="mt-6 flex justify-start">
            <button
              type="button"
              onClick={handleContinue}
              className="rounded border border-foreground bg-foreground px-4 py-2 text-background hover:opacity-90"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </>
  );
}
