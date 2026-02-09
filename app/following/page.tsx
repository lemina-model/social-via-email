"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppGlobal, type Person } from "../types";

function PersonCard({ p }: { p: Person }) {
  return (
    <div className="rounded border border-foreground bg-background p-4 text-left">
      <div className="font-semibold text-foreground">{p.name}</div>
      <div className="mt-1 text-sm text-foreground/80">{p.email}</div>
    </div>
  );
}

export default function Following() {
  const router = useRouter();
  const person = useAppGlobal((state) => state.whoami);
  const following = useAppGlobal((state) => state.following);

  useEffect(() => {
    if (!person) {
      router.replace("/");
    }
  }, [person, router]);

  if (!person) return null;

  return (
    <>
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Following</h1>
      </header>
      <div className="px-6 py-6 text-left">
        <div className="flex flex-col gap-3">
          {following.length === 0 ? (
            <p className="text-foreground/80">No one followed yet.</p>
          ) : (
            following.map((p) => <PersonCard key={p.email} p={p} />)
          )}
        </div>
      </div>
    </>
  );
}
