import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { listCourses, listPeriods, listTeachers, syncCourses } from "@/features/courses/server/courses";
import { SyncCoursesButton } from "@/features/courses/components/sync-courses-button";
import { CoursesView } from "@/features/courses/components/courses-view";
import { CoursesFilters } from "@/features/courses/components/courses-filters";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";
import type { CourseState } from "@/features/courses/types/course";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; teacherId?: string; periodId?: string }>;
}) {
  const t = await getTranslations("courses");
  const { q, teacherId, periodId } = await searchParams;

  if (listCourses().length === 0) {
    try {
      await syncCourses(await getCallbackRedirectUri());
    } catch {
      // first-sync failure is surfaced by the empty state + manual Sync button below
    }
  }

  const states: CourseState[] = ["ACTIVE", "ARCHIVED"];
  const [active, archived] = states.map((state) =>
    listCourses({ state, query: q, teacherId, periodId })
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <SyncCoursesButton />
      </div>

      <Suspense fallback={null}>
        <CoursesFilters teachers={listTeachers()} periods={listPeriods()} />
      </Suspense>

      <CoursesView active={active} archived={archived} />
    </>
  );
}
