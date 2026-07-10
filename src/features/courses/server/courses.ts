import { db } from "@/lib/db";
import { getClassroomClient } from "@/lib/classroom";
import type { classroom_v1 } from "googleapis";
import type { Course, CourseState, CourseTeacher, Period, TeacherOption } from "@/features/courses/types/course";

interface CourseRow {
  id: string;
  name: string;
  section: string | null;
  room: string | null;
  course_state: CourseState;
  alternate_link: string;
  creation_time: string | null;
  update_time: string | null;
  period_id: string | null;
  owner_id: string | null;
}

const selectTeachersByCourse = db.prepare(`
  SELECT teacher_id, name, photo_url FROM course_teachers
  WHERE course_id = ?
  ORDER BY (teacher_id = ?) DESC, name
`);

const selectPendingCount = db.prepare(`
  SELECT COUNT(*) as count FROM posts
  WHERE course_id = ? AND category = 'TAREFA' AND state = 'PUBLISHED' AND due_date >= date('now')
`);

function getPendingCount(courseId: string): number {
  const row = selectPendingCount.get(courseId) as unknown as { count: number };
  return row.count;
}

function getCourseTeachers(courseId: string, ownerId: string | null): CourseTeacher[] {
  const rows = selectTeachersByCourse.all(courseId, ownerId ?? "") as unknown as {
    teacher_id: string;
    name: string;
    photo_url: string | null;
  }[];
  return rows.map((row) => ({
    name: row.name,
    photoUrl: row.photo_url,
    isOwner: row.teacher_id === ownerId,
  }));
}

function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    section: row.section,
    room: row.room,
    courseState: row.course_state,
    alternateLink: row.alternate_link,
    creationTime: row.creation_time,
    updateTime: row.update_time,
    teachers: getCourseTeachers(row.id, row.owner_id),
    periodId: row.period_id,
    ownerId: row.owner_id,
    pendingCount: getPendingCount(row.id),
  };
}

const upsertPeriod = db.prepare(`
  INSERT INTO periods (id, name) VALUES (?, ?)
  ON CONFLICT(id) DO NOTHING
`);

// ponytail: regex covers the patterns from the spec (YYYY.N, YYYY/N, YYYY-N, "Semestre YYYY-N",
// "Nº período"); anything else falls back to creation-date-based inference.
function inferPeriod(courseName: string, creationTime: string | null): Period {
  const yearTerm = courseName.match(/(20\d{2})[./-](\d)\b/);
  if (yearTerm) {
    const label = `${yearTerm[1]}.${yearTerm[2]}`;
    return { id: label, name: label };
  }

  const date = creationTime ? new Date(creationTime) : new Date();
  const year = date.getFullYear();

  const termOnly = courseName.match(/(\d)\s*[ºo]\s*per[ií]odo/i);
  if (termOnly) {
    const label = `${year}.${termOnly[1]}`;
    return { id: label, name: label };
  }

  const term = date.getMonth() >= 6 ? 2 : 1;
  const label = `${year}.${term}`;
  return { id: label, name: label };
}

const upsertCourse = db.prepare(`
  INSERT INTO courses (id, name, section, room, course_state, alternate_link, creation_time, update_time, period_id, owner_id, period_manual)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    section = excluded.section,
    room = excluded.room,
    course_state = excluded.course_state,
    alternate_link = excluded.alternate_link,
    creation_time = excluded.creation_time,
    update_time = excluded.update_time,
    owner_id = excluded.owner_id,
    period_id = CASE WHEN courses.period_manual = 1 THEN courses.period_id ELSE excluded.period_id END
`);

const deleteCourseTeachers = db.prepare(`DELETE FROM course_teachers WHERE course_id = ?`);

const insertCourseTeacher = db.prepare(`
  INSERT INTO course_teachers (course_id, teacher_id, name, photo_url)
  VALUES (?, ?, ?, ?)
`);

async function syncCourseTeachers(classroom: classroom_v1.Classroom, courseId: string) {
  const teachers: { teacherId: string; name: string; photoUrl: string | null }[] = [];

  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.teachers.list({ courseId, pageToken });

    for (const teacher of data.teachers ?? []) {
      const name = teacher.profile?.name?.fullName;
      if (!teacher.userId || !name) continue;
      teachers.push({ teacherId: teacher.userId, name, photoUrl: teacher.profile?.photoUrl ?? null });
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  deleteCourseTeachers.run(courseId);
  for (const teacher of teachers) {
    insertCourseTeacher.run(courseId, teacher.teacherId, teacher.name, teacher.photoUrl);
  }
}

export async function syncCourses(redirectUri: string): Promise<void> {
  const classroom = await getClassroomClient(redirectUri);

  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.list({ pageToken });

    for (const course of data.courses ?? []) {
      if (!course.id || !course.name || !course.courseState || !course.alternateLink) {
        continue;
      }

      const period = inferPeriod(course.name, course.creationTime ?? null);
      upsertPeriod.run(period.id, period.name);

      upsertCourse.run(
        course.id,
        course.name,
        course.section ?? null,
        course.room ?? null,
        course.courseState,
        course.alternateLink,
        course.creationTime ?? null,
        course.updateTime ?? null,
        period.id,
        course.ownerId ?? null
      );

      await syncCourseTeachers(classroom, course.id);
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
}

const selectCourseById = db.prepare(`SELECT * FROM courses WHERE id = ?`);

export function getCourse(id: string): Course | null {
  const row = selectCourseById.get(id) as unknown as CourseRow | undefined;
  return row ? toCourse(row) : null;
}

export interface ListCoursesFilter {
  state?: CourseState;
  query?: string;
  teacherId?: string;
  periodId?: string;
}

export function listCourses(filter: ListCoursesFilter = {}): Course[] {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filter.state) {
    conditions.push("course_state = ?");
    params.push(filter.state);
  }
  if (filter.query) {
    conditions.push("name LIKE ?");
    params.push(`%${filter.query}%`);
  }
  if (filter.teacherId) {
    conditions.push("id IN (SELECT course_id FROM course_teachers WHERE teacher_id = ?)");
    params.push(filter.teacherId);
  }
  if (filter.periodId) {
    conditions.push("period_id = ?");
    params.push(filter.periodId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM courses ${where} ORDER BY name`)
    .all(...params) as unknown as CourseRow[];

  return rows.map(toCourse);
}

const selectDistinctTeachers = db.prepare(
  `SELECT teacher_id as id, name FROM course_teachers GROUP BY teacher_id, name ORDER BY name`
);

export function listTeachers(): TeacherOption[] {
  const rows = selectDistinctTeachers.all() as unknown as TeacherOption[];
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

const selectPeriods = db.prepare(`SELECT id, name FROM periods ORDER BY id DESC`);

export function listPeriods(): Period[] {
  const rows = selectPeriods.all() as unknown as Period[];
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

const setCoursePeriodStmt = db.prepare(`UPDATE courses SET period_id = ?, period_manual = 1 WHERE id = ?`);

export function setCoursePeriod(courseId: string, periodName: string): void {
  const id = periodName.trim();
  if (!id) return;
  upsertPeriod.run(id, id);
  setCoursePeriodStmt.run(id, courseId);
}
