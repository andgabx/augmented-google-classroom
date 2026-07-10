import Link from "next/link";
import { TeacherAvatars } from "@/features/courses/components/teacher-avatars";
import type { Course } from "@/features/courses/types/course";

export function CourseCard({ course }: { course: Course }) {
  return (
    <div className="group relative flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted">
      <Link href={`/courses/${course.id}`} className="absolute inset-0" aria-label={course.name} />
      <div className="flex flex-col gap-1 pr-32">
        <span className="font-medium text-foreground">{course.name}</span>
        <div className="flex items-center gap-2">
          {course.section && (
            <span className="text-sm text-muted-foreground">{course.section}</span>
          )}
          {course.periodId && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {course.periodId}
            </span>
          )}
        </div>
      </div>
      <TeacherAvatars teachers={course.teachers} />
      <a
        href={course.alternateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-4 z-10 text-sm text-muted-foreground hover:text-foreground"
      >
        ↗ Abrir no Classroom
      </a>
    </div>
  );
}
