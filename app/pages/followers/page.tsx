"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppGlobal, type Author } from "../../lib/zustand/models";

function AuthorCard({ p }: { p: Author }) {
  return (
    <div className="rounded border border-foreground bg-background p-4 text-left">
      <div className="font-semibold text-foreground">{p.name}</div>
      <div className="mt-1 text-sm text-foreground/80">{p.email}</div>
    </div>
  );
}

export default function Followers() {
  const router = useRouter();
  const currentUser = useAppGlobal((state) => state.session.signedInAuthor);
  const followers = useAppGlobal((state) => state.followers);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  return (
    <>
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Followers</h1>
      </header>
      <div className="px-6 py-6 text-left">
        <div className="flex flex-col gap-3">
          {followers.length === 0 ? (
            <p className="text-foreground/80">No followers yet.</p>
          ) : (
            followers.map((p) => <AuthorCard key={p.email} p={p} />)
          )}
        </div>
      </div>
    </>
  );
}
