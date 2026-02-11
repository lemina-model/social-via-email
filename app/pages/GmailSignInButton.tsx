"use client";

import Script from "next/script";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppGlobal } from "../lib/zustand/models";

const SCOPE = "openid email profile https://www.googleapis.com/auth/gmail.modify https://mail.google.com/";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export function GmailSignInButton() {
  const router = useRouter();
  const currentUser = useAppGlobal((state) => state.session.signedInAuthor);
  const setSignedInAuthor = useAppGlobal((state) => state.session.setSignedInAuthor);
  const setGmailToken = useAppGlobal((state) => state.session.setGmailToken);
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

        const r = await fetch(USERINFO_URL, {
          headers: { Authorization: `Bearer ${res.access_token}` },
        });
        if (!r.ok) return;
        const user = (await r.json()) as { email?: string; name?: string };
        const email = user.email ?? "";
        const name = user.name?.trim() || email.split('@')[0];
        if (email) {

          /** Set the signed-in author and the Gmail access token. */
          setSignedInAuthor({ name, email });
          setGmailToken(res.access_token);

          router.push("/pages/loading");
        }
      },
    });
    tokenClient.requestAccessToken();
  }, [router, setSignedInAuthor, setGmailToken]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={!!currentUser}
        className="rounded border border-foreground bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        via Gmail
      </button>
    </>
  );
}
