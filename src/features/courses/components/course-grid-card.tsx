import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { TeacherAvatars } from "@/features/courses/components/teacher-avatars";
import type { Course } from "@/features/courses/types/course";

export function CourseGridCard({ course }: { course: Course }) {
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
        aria-label="Abrir no Classroom"
        className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 text-muted-foreground backdrop-blur-sm hover:text-foreground"
      >
        ↗
      </a>
      <div className="flex flex-col gap-1 p-3">
        <span className="line-clamp-2 text-sm font-medium text-foreground">{course.name}</span>
        <div className="flex items-center gap-2">
          {course.section && (
            <span className="text-xs text-muted-foreground">{course.section}</span>
          )}
          {course.periodId && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {course.periodId}
            </span>
          )}
        </div>
        <TeacherAvatars teachers={course.teachers} />
      </div>
    </div>
  );
}
