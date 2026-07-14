"use client";

import { useState } from "react";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { FeedItems } from "@/features/feed/components/feed-list";
import type { FeedPost } from "@/features/feed/types/feed-post";

export function FeedView({
  header,
  filters,
  posts,
}: {
  header: React.ReactNode;
  filters: React.ReactNode;
  posts: FeedPost[];
}) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3 pt-8">
        {header}
        {filters}
        {posts.length > 0 && <ViewToggle value={view} onChange={setView} />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        <FeedItems posts={posts} view={view} />
      </div>
    </div>
  );
}
