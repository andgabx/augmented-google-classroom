"use client";

import { useState } from "react";
import { ViewItems, ViewToggle, type ViewMode } from "@/components/view-toggle";
import { CourseCard } from "@/features/courses/components/course-card";
import { CourseGridCard } from "@/features/courses/components/course-grid-card";
import type { Course } from "@/features/courses/types/course";

export function CoursesView({ active, archived }: { active: Course[]; archived: Course[] }) {
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
    <>
      <ViewToggle value={view} onChange={setView} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Ativas ({active.length})</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma turma ativa.</p>
        ) : (
          renderCourses(active)
        )}
      </section>

      <details className="flex flex-col gap-3">
        <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
          Arquivadas ({archived.length})
        </summary>
        <div className="mt-3">{renderCourses(archived)}</div>
      </details>
    </>
  );
}
