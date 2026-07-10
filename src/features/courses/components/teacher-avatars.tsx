import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { shortName } from "@/lib/utils";
import type { CourseTeacher } from "@/features/courses/types/course";

export function TeacherAvatars({ teachers }: { teachers: CourseTeacher[] }) {
  if (teachers.length === 0) return null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <AvatarGroup>
        {teachers.map((teacher, index) => (
          <Avatar key={`${teacher.name}-${index}`} size="sm">
            <AvatarImage
              src={teacher.photoUrl ?? undefined}
              alt={teacher.name}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>{teacher.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <span className="truncate text-xs text-muted-foreground">
        {teachers
          .map((teacher) => (teacher.isOwner ? `${shortName(teacher.name)} (titular)` : shortName(teacher.name)))
          .join(", ")}
      </span>
    </div>
  );
}
