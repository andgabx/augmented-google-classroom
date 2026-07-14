"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ViewItems, ViewToggle, type ViewMode } from "@/components/view-toggle";
import { CourseCard } from "@/features/courses/components/course-card";
import { CourseGridCard } from "@/features/courses/components/course-grid-card";
import { SyncCoursesButton } from "@/features/courses/components/sync-courses-button";
import type { Course } from "@/features/courses/types/course";

export function CoursesView({
  header,
  filters,
  active,
  archived,
}: {
  header: React.ReactNode;
  filters: React.ReactNode;
  active: Course[];
  archived: Course[];
}) {
  const t = useTranslations("courses");
  const [view, setView] = useState<ViewMode>("list");

  function renderCourses(courses: Course[]) {
    return (
      <ViewItems
        view={view}
        items={courses}
        keyFor={(course) => course.id}
        renderListItem={(course) => <CourseCard course={course} />}
        renderGridItem={(course) => <CourseGridCard course={course} />}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3 pt-8 pb-3">
        {header}
        {filters}
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain pb-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("active", { count: active.length })}
          </h2>
          {active.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-foreground">{t("noActiveClasses")}</p>
                <p className="text-sm text-muted-foreground">{t("noActiveClassesHint")}</p>
              </div>
              <SyncCoursesButton />
            </div>
          ) : (
            renderCourses(active)
          )}
        </section>

        <details className="flex flex-col gap-3">
          <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
            {t("archived", { count: archived.length })}
          </summary>
          <div className="mt-3">{renderCourses(archived)}</div>
        </details>
      </div>
    </div>
  );
}
