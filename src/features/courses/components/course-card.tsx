import type { Course } from "@/features/courses/types/course";

export function CourseCard({ course }: { course: Course }) {
  return (
    <a
      href={course.alternateLink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted"
    >
      <span className="font-medium text-foreground">{course.name}</span>
      {course.section && (
        <span className="text-sm text-muted-foreground">{course.section}</span>
      )}
    </a>
  );
}
