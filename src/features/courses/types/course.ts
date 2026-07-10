export type CourseState =
  | "ACTIVE"
  | "ARCHIVED"
  | "PROVISIONED"
  | "DECLINED"
  | "SUSPENDED";

export interface CourseTeacher {
  name: string;
  photoUrl: string | null;
  isOwner: boolean;
}

export interface Period {
  id: string;
  name: string;
}

export interface TeacherOption {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  name: string;
  section: string | null;
  room: string | null;
  courseState: CourseState;
  alternateLink: string;
  creationTime: string | null;
  updateTime: string | null;
  teachers: CourseTeacher[];
  periodId: string | null;
  ownerId: string | null;
  pendingCount: number;
}
