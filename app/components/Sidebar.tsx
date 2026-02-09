"use client";

import Link from "next/link";
import { APP_KEYWORD, LOADING_COMPLETE_COOKIE_NAME, SESSION_COOKIE_NAME } from "../constants";
import type { Person } from "../types";

const navItems = [
  { label: "Composite Timeline", href: "/following-timeline" },
  { label: "Timeline Lookup", href: "/timeline-lookup" },
  { label: "My Timeline", href: "/my-timeline" },
  { label: "Following", href: "/following" },
  { label: "Followers", href: "/followers" },
] as const;

type SidebarProps = {
  person: Person | null;
  loadingComplete: boolean;
};

export function Sidebar({ person, loadingComplete }: SidebarProps) {
  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-foreground px-4 py-6">
      <Link
        href="/"
        className="text-right text-lg font-semibold text-foreground hover:underline"
      >
        {APP_KEYWORD.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </Link>

      {person ? (
        <>
          <p className="mt-6 truncate text-right text-sm font-medium text-foreground" title={person.name}>
            {person.name}
          </p>
          <p className="truncate text-right text-sm text-foreground/80" title={person.email}>
            {person.email}
          </p>
          <button
            type="button"
            onClick={() => {
              document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
              document.cookie = `${LOADING_COMPLETE_COOKIE_NAME}=; path=/; max-age=0`;
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
