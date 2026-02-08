"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppBanner } from "../components/AppBanner";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

type InboxState =
  | { status: "loading" }
  | { status: "no-token" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      email: string;
      subjects: string[];
    };

function getSubjectFromMessage(payload: { headers?: Array<{ name: string; value: string }> }): string {
  const headers = payload?.headers ?? [];
  const subject = headers.find((h) => h.name === "Subject");
  return subject?.value ?? "(No subject)";
}

export default function InboxPage() {
  const router = useRouter();
  const [state, setState] = useState<InboxState>({ status: "loading" });

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("gmail_access_token") : null;
    if (!token) {
      setState({ status: "no-token" });
      return;
    }

    const auth = `Bearer ${token}`;

    (async () => {
      try {
        const [profileRes, listRes] = await Promise.all([
          fetch(`${GMAIL_API}/profile`, { headers: { Authorization: auth } }),
          fetch(`${GMAIL_API}/messages?labelIds=INBOX&maxResults=30`, { headers: { Authorization: auth } }),
        ]);

        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            sessionStorage.removeItem("gmail_access_token");
            setState({ status: "no-token" });
            return;
          }
          const errBody = await profileRes.json().catch(() => ({})) as { error?: { message?: string } };
          const msg = errBody?.error?.message ?? `Profile: ${profileRes.status}`;
          throw new Error(msg);
        }
        if (!listRes.ok) {
          const errBody = await listRes.json().catch(() => ({})) as { error?: { message?: string } };
          const msg = errBody?.error?.message ?? `Messages: ${listRes.status}`;
          throw new Error(msg);
        }

        const profile = (await profileRes.json()) as { emailAddress?: string };
        const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
        const messages = list.messages ?? [];
        const email = profile.emailAddress ?? "Unknown";

        if (messages.length === 0) {
          setState({ status: "ready", email, subjects: [] });
          return;
        }

        const subjectPromises = messages.map(async (m) => {
          const r = await fetch(
            `${GMAIL_API}/messages/${m.id}?format=metadata&metadataHeaders=Subject`,
            { headers: { Authorization: auth } }
          );
          if (!r.ok) return "(Unable to load)";
          const msg = (await r.json()) as { payload?: { headers?: Array<{ name: string; value: string }> } };
          return getSubjectFromMessage(msg.payload ?? {});
        });

        const subjects = await Promise.all(subjectPromises);
        setState({ status: "ready", email, subjects });
      } catch (e) {
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Failed to load inbox",
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (state.status === "no-token") router.replace("/");
  }, [state.status, router]);

  if (state.status === "no-token" || state.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
        <AppBanner />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <p className="text-zinc-600 dark:text-zinc-400">
            {state.status === "no-token" ? "Redirecting to sign in…" : "Loading inbox…"}
          </p>
        </main>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
        <AppBanner />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <p className="text-red-600 dark:text-red-400">{state.message}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <AppBanner />
      <header className="flex items-center justify-center gap-4 border-b border-zinc-200 bg-zinc-100 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Signed in as {state.email}
        </p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("gmail_access_token");
            router.push("/");
          }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Logout
        </button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-start px-6 py-8">
        <div className="w-full max-w-2xl">
          <h2 className="mb-4 text-center text-lg font-medium text-zinc-800 dark:text-zinc-200">
            Inbox
          </h2>
          {state.subjects.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400">No messages in inbox.</p>
          ) : (
            <ul className="space-y-2">
              {state.subjects.map((subject, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {subject}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
