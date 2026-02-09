"use client";

import Script from "next/script";
import { useCallback } from "react";
import { useAuth } from "./AuthContext";
import { GMAIL_TOKEN_STORAGE_KEY, SESSION_COOKIE_NAME } from "../constants";
import type { Person } from "../types";

const SCOPE = "openid email profile https://www.googleapis.com/auth/gmail.modify";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function setSessionCookie(person: Person) {
  const payload = JSON.stringify({ name: person.name, email: person.email });
  const base64 = typeof btoa !== "undefined"
    ? btoa(unescape(encodeURIComponent(payload)))
    : Buffer.from(payload).toString("base64");
  const value = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  document.cookie = `${SESSION_COOKIE_NAME}=${value}; path=/; max-age=${SESSION_MAX_AGE_SEC}; samesite=lax`;
}

export function ViaGmailButton() {
  const person = useAuth();
  const handleClick = useCallback(() => {
    const g = typeof window !== "undefined" ? (window as unknown as { google?: { accounts?: { oauth2?: { initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (res: { access_token?: string; error?: string }) => void;
    }) => { requestAccessToken: () => void } } } } })?.google : undefined;
    if (!g?.accounts?.oauth2?.initTokenClient) {
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const tokenClient = g.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: async (res) => {
        if (res.error || !res.access_token) return;
        try {
          const r = await fetch(USERINFO_URL, {
            headers: { Authorization: `Bearer ${res.access_token}` },
          });
          if (!r.ok) return;
          const user = (await r.json()) as { email?: string; name?: string };
          const email = user.email ?? "";
          const name = (user.name ?? email).trim() || email;
          if (email) {
            setSessionCookie({ name, email });
            sessionStorage.setItem(GMAIL_TOKEN_STORAGE_KEY, res.access_token);
            window.location.href = "/loading";
          }
        } catch {
          // stay on page
        }
      },
    });
    tokenClient.requestAccessToken();
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={!!person}
        className="rounded border border-foreground bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        via Gmail
      </button>
    </>
  );
}
