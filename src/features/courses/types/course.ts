export type CourseState =
  | "ACTIVE"
  | "ARCHIVED"
  | "PROVISIONED"
  | "DECLINED"
  | "SUSPENDED";

export interface Course {
  id: string;
  name: string;
  section: string | null;
  room: string | null;
  courseState: CourseState;
  alternateLink: string;
  creationTime: string | null;
  updateTime: string | null;
}
