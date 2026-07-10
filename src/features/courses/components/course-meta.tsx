import { useTranslations } from "next-intl";
import type { Course } from "@/features/courses/types/course";

export function CourseMeta({ course, size = "sm" }: { course: Course; size?: "sm" | "xs" }) {
  const t = useTranslations("courses");
  const textSize = size === "sm" ? "text-sm" : "text-xs";

  return (
    <div className="flex items-center gap-2">
      {course.section && <span className={`${textSize} text-muted-foreground`}>{course.section}</span>}
      {course.periodId && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {course.periodId}
        </span>
      )}
      {course.pendingCount > 0 && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {t("pendingCount", { count: course.pendingCount })}
        </span>
      )}
    </div>
  );
}
