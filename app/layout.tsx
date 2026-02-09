import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import { Sidebar } from "./components/Sidebar";

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
  description: "Social via Email",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;
  const cookieStore = await cookies();
  const session = cookieStore.get("sve_session")?.value;
  if (session) {
    try {
      const data = JSON.parse(
        Buffer.from(session, "base64url").toString("utf-8")
      ) as { email?: string };
      if (data.email) userEmail = data.email;
    } catch {
      // ignore invalid session
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider userEmail={userEmail}>
          <div className="mx-auto flex min-h-screen max-w-[100ch]">
            <Sidebar userEmail={userEmail} />
            <main className="min-h-screen flex-1 border-r border-foreground">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
