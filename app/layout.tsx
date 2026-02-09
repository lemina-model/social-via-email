import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { APP_KEYWORD, LOADING_COMPLETE_COOKIE_NAME, SESSION_COOKIE_NAME } from "./constants";
import type { Person } from "./types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social via Email",
  description: APP_KEYWORD,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let person: Person | null = null;
  let loadingComplete = false;
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (session) {
    try {
      const data = JSON.parse(
        Buffer.from(session, "base64url").toString("utf-8")
      ) as { email?: string; name?: string };
      if (data.email) {
        person = {
          name: (data.name ?? data.email).trim() || data.email,
          email: data.email,
        };
        loadingComplete = !!cookieStore.get(LOADING_COMPLETE_COOKIE_NAME)?.value;
      }
    } catch {
      // ignore invalid session
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider person={person}>
          <div className="mx-auto flex min-h-screen max-w-[100ch]">
            <Sidebar person={person} loadingComplete={loadingComplete} />
            <main className="min-h-screen flex-1 border-r border-foreground">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
