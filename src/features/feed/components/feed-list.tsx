"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Paperclip } from "lucide-react";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import type { FeedPost } from "@/features/feed/types/feed-post";
import type { FeedCategory } from "@/features/feed/types/feed-category";

const CATEGORY_KEY: Record<FeedCategory, "categoryTarefa" | "categoryPergunta" | "categoryMaterial" | "categoryAviso"> = {
  TAREFA: "categoryTarefa",
  PERGUNTA: "categoryPergunta",
  MATERIAL: "categoryMaterial",
  AVISO: "categoryAviso",
};

function FeedItem({
  post,
  showCourse,
  view,
  index,
}: {
  post: FeedPost;
  showCourse: boolean;
  view: ViewMode;
  index: number;
}) {
  const t = useTranslations("feed");
  const isTask = post.feedCategory === "TAREFA" || post.feedCategory === "PERGUNTA";
  const content = (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="w-fit rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
        {t(CATEGORY_KEY[post.feedCategory])}
      </span>
      <span className={`font-medium text-foreground ${view === "grid" ? "line-clamp-2 text-sm" : "truncate text-sm"}`}>
        {post.title ?? post.text ?? t("untitled")}
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {showCourse && `${post.courseName} · `}
        {post.creationTime && new Date(post.creationTime).toLocaleDateString()}
        {post.attachments.length > 0 && (
          <>
            {" · "}
            <Paperclip className="size-3" />
            {t("attachmentsCount", { count: post.attachments.length })}
          </>
        )}
      </span>
    </div>
  );
  const linkClassName =
    view === "grid"
      ? "group flex h-full flex-col justify-between gap-3 rounded-2xl bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-lg"
      : "group flex items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-lg";
  const arrow = (
    <ArrowRight className="size-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
  );

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
    >
      {isTask ? (
        <Link href={`/deadlines/${post.id}`} className={linkClassName}>
          {content}
          {arrow}
        </Link>
      ) : (
        <a href={post.alternateLink} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {content}
          {arrow}
        </a>
      )}
    </motion.li>
  );
}

export function FeedItems({
  posts,
  showCourse = true,
  view,
}: {
  posts: FeedPost[];
  showCourse?: boolean;
  view: ViewMode;
}) {
  const t = useTranslations("feed");

  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className={view === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col gap-2"}>
      {posts.map((post, index) => (
        <FeedItem key={post.id} post={post} showCourse={showCourse} view={view} index={index} />
      ))}
    </ul>
  );
}

export function FeedList({ posts, showCourse = true }: { posts: FeedPost[]; showCourse?: boolean }) {
  const [view, setView] = useState<ViewMode>("list");

  if (posts.length === 0) {
    return <FeedItems posts={posts} showCourse={showCourse} view={view} />;
  }

  return (
    <>
      <div className="py-3">
        <ViewToggle value={view} onChange={setView} />
      </div>
      <FeedItems posts={posts} showCourse={showCourse} view={view} />
    </>
  );
}
