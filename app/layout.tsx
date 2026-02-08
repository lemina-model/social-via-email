import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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

const navItems = [
  { label: "My Timeline", href: "/my-timeline" },
  { label: "Following Timeline", href: "/following-timeline" },
  { label: "Timeline Lookup", href: "/timeline-lookup" },
  { label: "Following", href: "/following" },
  { label: "Followers", href: "/followers" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="mx-auto flex min-h-screen max-w-[100ch]">
          {/* Left sidebar */}
          <aside className="flex w-56 flex-shrink-0 flex-col border-r border-foreground px-4 py-6">
            <Link href="/" className="text-right text-lg font-semibold text-foreground hover:underline">
              Social via Email
            </Link>

            <nav className="mt-16 flex flex-col gap-3 text-right">
              {navItems.map(({ label, href }) => (
                <span
                  key={href}
                  className="cursor-not-allowed text-foreground opacity-50"
                  aria-disabled
                >
                  {label}
                </span>
              ))}
            </nav>
          </aside>
          {/* Right content area */}
          <main className="min-h-screen flex-1 border-r border-foreground">{children}</main>
        </div>
      </body>
    </html>
  );
}
