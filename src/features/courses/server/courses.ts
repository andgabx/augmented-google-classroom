import { db } from "@/lib/db";
import { getClassroomClient } from "@/lib/classroom";
import type { Course, CourseState } from "@/features/courses/types/course";

interface CourseRow {
  id: string;
  name: string;
  section: string | null;
  room: string | null;
  course_state: CourseState;
  alternate_link: string;
  creation_time: string | null;
  update_time: string | null;
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
  };
}

const upsertCourse = db.prepare(`
  INSERT INTO courses (id, name, section, room, course_state, alternate_link, creation_time, update_time)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    section = excluded.section,
    room = excluded.room,
    course_state = excluded.course_state,
    alternate_link = excluded.alternate_link,
    creation_time = excluded.creation_time,
    update_time = excluded.update_time
`);

export async function syncCourses(redirectUri: string): Promise<void> {
  const classroom = await getClassroomClient(redirectUri);

  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.list({ pageToken });

    for (const course of data.courses ?? []) {
      if (!course.id || !course.name || !course.courseState || !course.alternateLink) {
        continue;
      }

      upsertCourse.run(
        course.id,
        course.name,
        course.section ?? null,
        course.room ?? null,
        course.courseState,
        course.alternateLink,
        course.creationTime ?? null,
        course.updateTime ?? null
      );
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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM courses ${where} ORDER BY name`)
    .all(...params) as unknown as CourseRow[];

  return rows.map(toCourse);
}
