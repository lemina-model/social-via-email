"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppGlobal, type Post } from "../../lib/zustand/models";

function PostCard({ post }: { post: Post }) {
  return (
    <div className="rounded border border-foreground bg-background p-4 text-left">
      <div className="font-semibold text-foreground">{post.authorEmail}</div>
      <div className="mt-1 text-foreground whitespace-pre-wrap break-words">{post.content}</div>
    </div>
  );
}

export default function MyTimeline() {
  const router = useRouter();
  const currentUser = useAppGlobal((state) => state.session.signedInAuthor);
  const myTimeline = useAppGlobal((state) => state.myTimeline);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  return (
    <>
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">My Timeline</h1>
      </header>
      <div className="px-6 py-6 text-left">
        <div className="flex flex-col gap-3">
          {myTimeline.length === 0 ? (
            <p className="text-foreground/80">No posts yet.</p>
          ) : (
            myTimeline.map((tree) => <PostCard key={tree.rootPost.uuid} post={tree.rootPost} />)
          )}
        </div>
      </div>
    </>
  );
}
