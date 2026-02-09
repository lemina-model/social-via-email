"use client";

import Script from "next/script";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppGlobal } from "../types";

const SCOPE = "openid email profile https://www.googleapis.com/auth/gmail.modify";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export function ViaGmailButton() {
  const router = useRouter();
  const person = useAppGlobal((state) => state.whoami);
  const setWhoami = useAppGlobal((state) => state.setWhoami);
  const setGmailToken = useAppGlobal((state) => state.setGmailToken);
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
          const name = user.name?.trim() || email.split('@')[0];
          if (email) {
            const userInfo = { name, email };
            setWhoami(userInfo);
            setGmailToken(res.access_token);
            router.push("/loading");
          }
        } catch {
          // stay on page
        }
      },
    });
    tokenClient.requestAccessToken();
  }, [router, setWhoami, setGmailToken]);

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
