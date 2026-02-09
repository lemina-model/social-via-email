"use client";

import Link from "next/link";

const navItems = [
  { label: "My Timeline", href: "/my-timeline" },
  { label: "Composite Timeline", href: "/following-timeline" },
  { label: "Timeline Lookup", href: "/timeline-lookup" },
  { label: "Following", href: "/following" },
  { label: "Followers", href: "/followers" },
] as const;

type SidebarProps = {
  userEmail: string | null;
};

export function Sidebar({ userEmail }: SidebarProps) {
  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-foreground px-4 py-6">
      <Link
        href="/"
        className="text-right text-lg font-semibold text-foreground hover:underline"
      >
        Social via Email
      </Link>

      {userEmail ? (
        <>
          <p className="mt-6 truncate text-right text-sm text-foreground" title={userEmail}>
            {userEmail}
          </p>
          <button
            type="button"
            onClick={() => {
              document.cookie = "sve_session=; path=/; max-age=0";
              window.location.href = "/";
            }}
            className="mt-2 text-right text-sm text-foreground underline hover:no-underline"
          >
            Sign out
          </button>
          <nav className="mt-8 flex flex-col gap-3 text-right">
            {navItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-foreground hover:underline"
              >
                {label}
              </Link>
            ))}
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
