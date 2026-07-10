"use client";

import Link from "next/link";
import { ExternalLink, GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
import { CourseMeta } from "@/features/courses/components/course-meta";
import { TeacherAvatars } from "@/features/courses/components/teacher-avatars";
import type { Course } from "@/features/courses/types/course";

export function CourseGridCard({ course }: { course: Course }) {
  const t = useTranslations("courses");

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:bg-muted">
      <Link href={`/courses/${course.id}`} className="absolute inset-0" aria-label={course.name} />
      <div className="flex aspect-video items-center justify-center bg-sidebar-primary/10">
        <GraduationCap className="size-8 text-sidebar-primary" />
      </div>
      <a
        href={course.alternateLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("openInClassroom")}
        className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm hover:text-foreground"
      >
        <ExternalLink className="size-3.5" />
      </a>
      <div className="flex flex-col gap-1 p-3">
        <span className="line-clamp-2 text-base font-semibold text-foreground">{course.name}</span>
        <CourseMeta course={course} size="xs" />
        <TeacherAvatars teachers={course.teachers} />
      </div>
    </div>
  );
}
