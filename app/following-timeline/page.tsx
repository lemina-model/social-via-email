"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppGlobal, type Post } from "../types";

function PostCard({ post }: { post: Post }) {
  return (
    <div className="rounded border border-foreground bg-background p-4 text-left">
      <div className="font-semibold text-foreground">{post.authorEmail}</div>
      <div className="mt-1 text-foreground whitespace-pre-wrap break-words">{post.content}</div>
    </div>
  );
}

export default function FollowingTimeline() {
  const router = useRouter();
  const person = useAppGlobal((state) => state.whoami);
  const compositeTimeline = useAppGlobal((state) => state.compositeTimeline);

  useEffect(() => {
    if (!person) {
      router.replace("/");
    }
  }, [person, router]);

  if (!person) return null;

  return (
    <>
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Composite Following Timeline</h1>
      </header>
      <div className="px-6 py-6 text-left">
        <div className="flex flex-col gap-3">
          {compositeTimeline.length === 0 ? (
            <p className="text-foreground/80">No posts from people you follow.</p>
          ) : (
            compositeTimeline.map((post) => <PostCard key={post.uuid} post={post} />)
          )}
        </div>
      </div>
    </>
  );
}
