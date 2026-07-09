import Link from "next/link";
import type { Course } from "@/features/courses/types/course";

export function CourseCard({ course }: { course: Course }) {
  return (
    <div className="group relative flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted">
      <Link href={`/courses/${course.id}`} className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{course.name}</span>
        {course.section && (
          <span className="text-sm text-muted-foreground">{course.section}</span>
        )}
      </Link>
      <a
        href={course.alternateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-4 text-sm text-muted-foreground hover:text-foreground"
      >
        ↗ Abrir no Classroom
      </a>
    </div>
  );
}
