import { getTranslations } from "next-intl/server";
import { listFeed } from "@/features/feed/server/feed";
import { listCourses } from "@/features/courses/server/courses";
import { FeedView } from "@/features/feed/components/feed-view";
import { FeedFilters } from "@/features/feed/components/feed-filters";
import { SyncDeadlinesButton } from "@/features/deadlines/components/sync-deadlines-button";
import type { FeedCategory } from "@/features/feed/types/feed-category";

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    courseId?: string;
    feedCategory?: string | string[];
    hasAttachment?: string;
    q?: string;
  }>;
}) {
  const t = await getTranslations("feed");
  const { courseId, feedCategory, hasAttachment, q } = await searchParams;
  const feedCategories = toArray(feedCategory) as FeedCategory[];

  const courses = listCourses();
  const posts = listFeed({
    courseId: courseId || undefined,
    query: q || undefined,
    feedCategory: feedCategories.length ? feedCategories : undefined,
    hasAttachment: hasAttachment === "true" ? true : hasAttachment === "false" ? false : undefined,
  });

  return (
    <FeedView
      header={
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("title")}</h1>
          <SyncDeadlinesButton />
        </div>
      }
      filters={<FeedFilters topics={[]} courses={courses} />}
      posts={posts}
    />
  );
}
