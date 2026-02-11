"use client";

import Script from "next/script";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { EMAIL_FOLDER_FOR_INBOX, EMAIL_FOLDER_FOR_DATA, FILE_OF_SEED_DATA, EMAIL_SUBJECT_FOR_REPO } from "../../constants";
import { parseAppGlobal, stringifyAppGlobal } from "../../lib/zustand/converter";
import { useAppGlobal, type Author, type Post, type Thread } from "../../lib/zustand/models";
import { readEmail, writeEmail } from "../../lib/gmail/EmailFile";

export type LogFn = (message: string) => void;

const GMAIL_LABELS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/labels";

type OperationFn = (log: LogFn, accessToken: string) => Promise<void>;
const INIT_OPERATIONS: OperationFn[] = [
  createEmailLabelsOperation,
  readDataFromEmailOperation,
];

/** Create new email directories/labels if they do not exist. */
async function createEmailLabelsOperation(
  log: LogFn,
  accessToken: string
): Promise<void> {
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  /** List the existing labels once. */
  const listRes = await fetch(GMAIL_LABELS_URL, { headers: authHeader });
  if (!listRes.ok) {
    log(`Failed to list labels: ${listRes.status}`);
    return;
  }

  const listData = (await listRes.json()) as { labels?: Array<{ name: string }> };
  const labels = listData.labels ?? [];

  for (const folderName of [EMAIL_FOLDER_FOR_INBOX, EMAIL_FOLDER_FOR_DATA]) {
    log("");
    log(`Creating a new directory named "${folderName}"`);

    const exists = labels.some((l) => l.name === folderName);
    if (exists) {
      log(`Directory "${folderName}" already exists.`);
      continue;
    }

    const createRes = await fetch(GMAIL_LABELS_URL, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName }),
    });
    if (!createRes.ok) {
      log(`Failed to create label: ${createRes.status}`);
    } else {
      log(`Created label "${folderName}".`);
    }
  }
}

/** Read data from email or seed file, then always write current store to email. */
async function readDataFromEmailOperation(
  log: LogFn,
  accessToken: string
): Promise<void> {
  log("");
  log(`Reading the email with the subject "${EMAIL_SUBJECT_FOR_REPO}"`);

  const jsonFromEmail = await readEmail(EMAIL_SUBJECT_FOR_REPO, accessToken);
  if (jsonFromEmail !== null) {
    try {
      parseAppGlobal(jsonFromEmail);
      const state = useAppGlobal.getState();
      const threads = state.myTimeline.length + state.othersTimeline.length;
      const people = state.following.length + state.followers.length;
      log(`Loaded app state with ${threads} threads and ${people} people.`);
      return;
    } catch {
      log("Email content was not valid JSON; will try seed file.");
    }
  } else {
    log(`The email "${EMAIL_SUBJECT_FOR_REPO}" was not found`);
  }

  log(`Reading from ${FILE_OF_SEED_DATA}`);
  const fileRes = await fetch(FILE_OF_SEED_DATA);
  if (fileRes.ok) {
    try {
      const jsonFromFile = await fileRes.text();
      parseAppGlobal(jsonFromFile);
      log(`Loaded app state from ${FILE_OF_SEED_DATA}`);
    } catch {
      log(`File ${FILE_OF_SEED_DATA} is not valid JSON; keeping current app state.`);
    }
  } else {
    log(`File ${FILE_OF_SEED_DATA} not found.`);
  }

  const jsonToWrite = stringifyAppGlobal();
  await writeEmail(EMAIL_SUBJECT_FOR_REPO, jsonToWrite, accessToken);
  log(`Wrote app state to the email "${EMAIL_SUBJECT_FOR_REPO}".`);
}

async function runOperations(
  log: LogFn,
  accessToken: string
): Promise<void> {
  for (const op of INIT_OPERATIONS) {
    await op(log, accessToken);
  }
}

export default function LoadingPage() {
  const router = useRouter();
  const currentUser = useAppGlobal((state) => state.session.signedInAuthor);
  const setLoadingComplete = useAppGlobal((state) => state.session.setLoadingComplete);
  const [logs, setLogs] = useState<string[]>([]);
  const [operationsComplete, setOperationsComplete] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!currentUser) {
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

    const token = useAppGlobal.getState().session.gmailToken;
    if (!token) {
      log("Not signed in: no Gmail access token. No operations performed.");
      setOperationsComplete(true);
      return;
    }

    runOperations(log, token)
      .then(() => {
        setOperationsComplete(true);
        setLoadingComplete(true);
      })
      .catch(() => {
        log("Error during loading.");
        setOperationsComplete(true);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, router, setLoadingComplete]);

  if (!currentUser) return null;

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
          <>
            <p className="mt-6 text-foreground">&nbsp;</p>
            <p className="mt-2 text-foreground">
              Loading completed successfully. You can continue using any page in the left panel.
            </p>
          </>
        )}
      </div>
    </>
  );
}
