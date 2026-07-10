"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { CourseMeta } from "@/features/courses/components/course-meta";
import { TeacherAvatars } from "@/features/courses/components/teacher-avatars";
import type { Course } from "@/features/courses/types/course";

export function CourseCard({ course }: { course: Course }) {
  const t = useTranslations("courses");

  return (
    <div className="group relative flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted">
      <Link href={`/courses/${course.id}`} className="absolute inset-0" aria-label={course.name} />
      <div className="flex flex-col gap-1 pr-32">
        <span className="text-base font-semibold text-foreground">{course.name}</span>
        <CourseMeta course={course} size="sm" />
      </div>
      <TeacherAvatars teachers={course.teachers} />
      <a
        href={course.alternateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="size-3.5" /> {t("openInClassroom")}
      </a>
    </div>
  );
}
