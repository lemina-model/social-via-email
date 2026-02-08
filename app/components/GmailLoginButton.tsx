"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

export function GmailLoginButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setErrorMessage("Google Client ID is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local");
      setStatus("error");
      return;
    }

    if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
      setErrorMessage("Google Sign-In is still loading. Please try again.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SCOPES,
      callback: (response) => {
        if (response.error) {
          setStatus("error");
          setErrorMessage(response.error === "popup_closed_by_user" ? "Sign-in was cancelled." : response.error);
          return;
        }
        setStatus("success");
        if (typeof response.access_token === "string") {
          try {
            sessionStorage.setItem("gmail_access_token", response.access_token);
          } catch {
            // ignore
          }
          router.push("/inbox");
        }
      },
    });

    tokenClient.requestAccessToken();
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleLogin}
        disabled={status === "loading"}
        className="rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {status === "loading" ? "Opening Gmail…" : "via Gmail"}
      </button>
      {status === "error" && errorMessage && (
        <p className="max-w-xs text-center text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      {status === "success" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Signed in with Gmail.</p>
      )}
    </div>
  );
}
