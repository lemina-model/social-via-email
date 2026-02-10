"use client";

import Link from "next/link";
import { APP_CODE_NAME } from "../constants";
import { useAppGlobal } from "../lib/zustand/types";

const navItems = [
  { label: "Composite Timeline", href: "/pages/compisite-timeline" },
  { label: "Timeline Lookup", href: "/pages/timeline-lookup" },
  { label: "My Timeline", href: "/pages/my-timeline" },
  { label: "Following", href: "/pages/following" },
  { label: "Followers", href: "/pages/followers" },
] as const;

export function Sidebar() {
  const whoami = useAppGlobal((state) => state.whoami);
  const loadingComplete = useAppGlobal((state) => state.loadingComplete);
  const signOut = useAppGlobal((state) => state.signOut);
  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-foreground px-4 py-6">
      <Link
        href="/"
        className="text-right text-lg font-semibold text-foreground hover:underline"
      >
        {APP_CODE_NAME.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </Link>

      {whoami ? (
        <>
          <p className="mt-6 truncate text-right text-sm font-medium text-foreground" title={whoami.name}>
            {whoami.name}
          </p>
          <p className="truncate text-right text-sm text-foreground/80" title={whoami.email}>
            {whoami.email}
          </p>
          <button
            type="button"
            onClick={() => {
              signOut();
              window.location.href = "/";
            }}
            className="mt-2 text-right text-sm text-foreground underline hover:no-underline"
          >
            Sign out
          </button>
          <nav className="mt-8 flex flex-col gap-3 text-right">
            {loadingComplete ? (
              navItems.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-foreground hover:underline"
                >
                  {label}
                </Link>
              ))
            ) : (
              navItems.map(({ label, href }) => (
                <span
                  key={href}
                  className="cursor-not-allowed text-foreground opacity-50"
                  aria-disabled
                >
                  {label}
                </span>
              ))
            )}
          </nav>
        </>
      ) : (
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
      )}
    </aside>
  );
}
