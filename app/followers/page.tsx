"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppGlobal } from "../types";

export default function Followers() {
  const router = useRouter();
  const person = useAppGlobal((state) => state.whoami);

  useEffect(() => {
    if (!person) {
      router.replace("/");
    }
  }, [person, router]);

  if (!person) return null;

  return (
    <>
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Followers</h1>
      </header>
      <div className="px-6 py-6 text-left">
        {/* Content panel - empty */}
      </div>
    </>
  );
}
