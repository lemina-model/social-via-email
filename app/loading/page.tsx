"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthContext";

export type LogFn = (message: string) => void;

/** Placeholder list of operations. Each runs with a log function to print to the content panel. */
const INIT_OPERATIONS: Array<(log: LogFn) => Promise<void>> = [];

const DELAY_WHEN_NO_OPS_MS = 5000;

async function runOperations(log: LogFn): Promise<void> {
  for (const op of INIT_OPERATIONS) {
    await op(log);
  }
}

export default function LoadingPage() {
  const router = useRouter();
  const person = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!person) {
      router.replace("/");
      return;
    }

    let cancelled = false;

    const log: LogFn = (message: string) => {
      if (cancelled) return;
      setLogs((prev) => [...prev, message]);
    };

    runOperations(log)
      .then(() => {
        if (cancelled) return;
        if (INIT_OPERATIONS.length === 0) {
          log("No operations; waiting " + DELAY_WHEN_NO_OPS_MS / 1000 + "s…");
          return new Promise<void>((resolve) =>
            setTimeout(resolve, DELAY_WHEN_NO_OPS_MS)
          );
        }
      })
      .then(() => {
        if (!cancelled) router.replace("/my-timeline");
      })
      .catch(() => {
        if (!cancelled) log("Error during loading.");
      });

    return () => {
      cancelled = true;
    };
  }, [person, router]);

  if (!person) return null;

  return (
    <>
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Loading ...</h1>
      </header>
      <div className="px-6 py-6 text-left">
        <pre className="min-h-[10rem] font-mono text-sm text-foreground whitespace-pre-wrap break-words">
          {logs.length === 0 ? "" : logs.join("\n")}
        </pre>
      </div>
    </>
  );
}
