import { db } from "@/lib/db";
import { getClassroomClient, getDriveClient } from "@/lib/classroom";
import type { classroom_v1 } from "googleapis";

const ALL_POST_STATES = ["PUBLISHED", "DRAFT", "DELETED"];

function formatDate(date?: classroom_v1.Schema$Date | null): string | null {
  if (!date?.year || !date.month || !date.day) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function formatTimeOfDay(time?: classroom_v1.Schema$TimeOfDay | null): string | null {
  if (time?.hours == null || time.minutes == null) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(time.hours)}:${pad(time.minutes)}`;
}

const upsertTopic = db.prepare(`
  INSERT INTO topics (id, course_id, name, update_time)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    update_time = excluded.update_time
`);

const upsertPost = db.prepare(`
  INSERT INTO posts (id, course_id, category, title, text, state, work_type, due_date, due_time, topic_id, alternate_link, creation_time, update_time)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    text = excluded.text,
    state = excluded.state,
    work_type = excluded.work_type,
    due_date = excluded.due_date,
    due_time = excluded.due_time,
    topic_id = excluded.topic_id,
    alternate_link = excluded.alternate_link,
    creation_time = excluded.creation_time,
    update_time = excluded.update_time
`);

const upsertMaterial = db.prepare(`
  INSERT INTO materials (id, post_id, type, drive_file_id, title, alternate_link, thumbnail_url, mime_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  ON CONFLICT(id) DO UPDATE SET
    type = excluded.type,
    drive_file_id = excluded.drive_file_id,
    title = excluded.title,
    alternate_link = excluded.alternate_link,
    thumbnail_url = excluded.thumbnail_url
`);

function upsertMaterials(postId: string, materials: classroom_v1.Schema$Material[] | undefined) {
  materials?.forEach((material, index) => {
    const id = `${postId}:${index}`;

    if (material.driveFile?.driveFile) {
      const file = material.driveFile.driveFile;
      upsertMaterial.run(id, postId, "DRIVE_FILE", file.id ?? null, file.title ?? null, file.alternateLink ?? null, file.thumbnailUrl ?? null);
    } else if (material.youtubeVideo) {
      const video = material.youtubeVideo;
      upsertMaterial.run(id, postId, "YOUTUBE", null, video.title ?? null, video.alternateLink ?? null, video.thumbnailUrl ?? null);
    } else if (material.link) {
      const link = material.link;
      upsertMaterial.run(id, postId, "LINK", null, link.title ?? null, link.url ?? null, link.thumbnailUrl ?? null);
    } else {
      upsertMaterial.run(id, postId, "OTHER", null, null, null, null);
    }
  });
}

async function syncTopics(classroom: classroom_v1.Classroom, courseId: string) {
  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.topics.list({ courseId, pageToken });

    for (const topic of data.topic ?? []) {
      if (!topic.topicId || !topic.name) continue;
      upsertTopic.run(topic.topicId, courseId, topic.name, topic.updateTime ?? null);
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
}

async function syncCourseWork(classroom: classroom_v1.Classroom, courseId: string) {
  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.courseWork.list({
      courseId,
      courseWorkStates: ALL_POST_STATES,
      pageToken,
    });

    for (const work of data.courseWork ?? []) {
      if (!work.id || !work.state || !work.alternateLink) continue;

      upsertPost.run(
        work.id,
        courseId,
        "TAREFA",
        work.title ?? null,
        null,
        work.state,
        work.workType ?? null,
        formatDate(work.dueDate),
        formatTimeOfDay(work.dueTime),
        work.topicId ?? null,
        work.alternateLink,
        work.creationTime ?? null,
        work.updateTime ?? null
      );
      upsertMaterials(work.id, work.materials);
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
}

async function syncCourseWorkMaterials(classroom: classroom_v1.Classroom, courseId: string) {
  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.courseWorkMaterials.list({
      courseId,
      courseWorkMaterialStates: ALL_POST_STATES,
      pageToken,
    });

    for (const material of data.courseWorkMaterial ?? []) {
      if (!material.id || !material.state || !material.alternateLink) continue;

      upsertPost.run(
        material.id,
        courseId,
        "MATERIAL",
        material.title ?? null,
        null,
        material.state,
        null,
        null,
        null,
        material.topicId ?? null,
        material.alternateLink,
        material.creationTime ?? null,
        material.updateTime ?? null
      );
      upsertMaterials(material.id, material.materials);
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
}

async function syncAnnouncements(classroom: classroom_v1.Classroom, courseId: string) {
  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.announcements.list({
      courseId,
      announcementStates: ALL_POST_STATES,
      pageToken,
    });

    for (const announcement of data.announcements ?? []) {
      if (!announcement.id || !announcement.state || !announcement.alternateLink) continue;

      upsertPost.run(
        announcement.id,
        courseId,
        "AVISO",
        null,
        announcement.text ?? null,
        announcement.state,
        null,
        null,
        null,
        null,
        announcement.alternateLink,
        announcement.creationTime ?? null,
        announcement.updateTime ?? null
      );
      upsertMaterials(announcement.id, announcement.materials);
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
}

interface PendingDriveMaterial {
  id: string;
  drive_file_id: string;
}

const findPendingDriveMaterials = db.prepare(`
  SELECT m.id, m.drive_file_id
  FROM materials m
  JOIN posts p ON p.id = m.post_id
  WHERE p.course_id = ? AND m.type = 'DRIVE_FILE' AND m.mime_type IS NULL AND m.drive_file_id IS NOT NULL
`);

const setMaterialMimeType = db.prepare(`UPDATE materials SET mime_type = ? WHERE id = ?`);

async function resolveMimeTypes(courseId: string, redirectUri: string) {
  const pending = findPendingDriveMaterials.all(courseId) as unknown as PendingDriveMaterial[];
  if (pending.length === 0) return;

  const drive = await getDriveClient(redirectUri);

  for (const material of pending) {
    const { data } = await drive.files.get({
      fileId: material.drive_file_id,
      fields: "mimeType",
    });
    if (data.mimeType) {
      setMaterialMimeType.run(data.mimeType, material.id);
    }
  }
}

export async function syncCourseMaterials(courseId: string, redirectUri: string): Promise<void> {
  const classroom = await getClassroomClient(redirectUri);

  await syncTopics(classroom, courseId);
  await syncCourseWork(classroom, courseId);
  await syncCourseWorkMaterials(classroom, courseId);
  await syncAnnouncements(classroom, courseId);
  await resolveMimeTypes(courseId, redirectUri);
}
