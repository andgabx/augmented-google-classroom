import { db } from "@/lib/db";
import { getClassroomClient, getDriveClient } from "@/lib/classroom";
import { indexCourseMaterialsContent } from "@/features/materials/server/index-content";
import { fileTypeGroup } from "@/features/materials/lib/file-type-group";
import { searchPosts, upsertPostSearchEntry } from "@/lib/search-posts";
import type { classroom_v1 } from "googleapis";
import type {
  FileTypeGroup,
  MaterialListItem,
  MaterialType,
  PostCategory,
  SubmissionAttachment,
  Topic,
} from "@/features/materials/types/post";

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
        work.description ?? null,
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
      upsertPostSearchEntry({
        id: work.id,
        courseId,
        category: "TAREFA",
        title: work.title ?? null,
        text: work.description ?? null,
      });
    }

    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
}

const setSubmissionState = db.prepare(`UPDATE posts SET submission_state = ?, late = ? WHERE id = ?`);

const upsertSubmissionAttachment = db.prepare(`
  INSERT INTO submission_attachments (id, post_id, type, drive_file_id, title, alternate_link, thumbnail_url)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    type = excluded.type,
    drive_file_id = excluded.drive_file_id,
    title = excluded.title,
    alternate_link = excluded.alternate_link,
    thumbnail_url = excluded.thumbnail_url
`);

const deleteSubmissionAttachments = db.prepare(`DELETE FROM submission_attachments WHERE post_id = ?`);

function upsertSubmissionAttachments(postId: string, attachments: classroom_v1.Schema$Attachment[] | undefined) {
  deleteSubmissionAttachments.run(postId);
  attachments?.forEach((attachment, index) => {
    const id = `${postId}:${index}`;

    if (attachment.driveFile) {
      const file = attachment.driveFile;
      upsertSubmissionAttachment.run(id, postId, "DRIVE_FILE", file.id ?? null, file.title ?? null, file.alternateLink ?? null, file.thumbnailUrl ?? null);
    } else if (attachment.youTubeVideo) {
      const video = attachment.youTubeVideo;
      upsertSubmissionAttachment.run(id, postId, "YOUTUBE", null, video.title ?? null, video.alternateLink ?? null, video.thumbnailUrl ?? null);
    } else if (attachment.link) {
      const link = attachment.link;
      upsertSubmissionAttachment.run(id, postId, "LINK", null, link.title ?? null, link.url ?? null, link.thumbnailUrl ?? null);
    } else {
      upsertSubmissionAttachment.run(id, postId, "OTHER", null, attachment.form?.title ?? null, attachment.form?.formUrl ?? null, attachment.form?.thumbnailUrl ?? null);
    }
  });
}

async function syncStudentSubmissions(classroom: classroom_v1.Classroom, courseId: string) {
  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.courseWork.studentSubmissions.list({
      courseId,
      courseWorkId: "-",
      userId: "me",
      pageToken,
    });

    for (const submission of data.studentSubmissions ?? []) {
      if (!submission.courseWorkId || !submission.state) continue;
      setSubmissionState.run(submission.state, submission.late ? 1 : 0, submission.courseWorkId);
      upsertSubmissionAttachments(submission.courseWorkId, submission.assignmentSubmission?.attachments);
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
      upsertPostSearchEntry({
        id: material.id,
        courseId,
        category: "MATERIAL",
        title: material.title ?? null,
        text: null,
      });
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
      upsertPostSearchEntry({
        id: announcement.id,
        courseId,
        category: "AVISO",
        title: null,
        text: announcement.text ?? null,
      });
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
  await syncStudentSubmissions(classroom, courseId);
  await syncCourseWorkMaterials(classroom, courseId);
  await syncAnnouncements(classroom, courseId);
  await resolveMimeTypes(courseId, redirectUri);
  await indexCourseMaterialsContent(courseId, redirectUri);
}

const countPosts = db.prepare(`SELECT COUNT(*) as count FROM posts WHERE course_id = ?`);

export function hasSyncedMaterials(courseId: string): boolean {
  const row = countPosts.get(courseId) as unknown as { count: number };
  return row.count > 0;
}

interface TopicRow {
  id: string;
  course_id: string;
  name: string;
  update_time: string | null;
}

export function listTopics(courseId: string): Topic[] {
  const rows = db
    .prepare(`SELECT * FROM topics WHERE course_id = ? ORDER BY name`)
    .all(courseId) as unknown as TopicRow[];

  return rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    updateTime: row.update_time,
  }));
}

interface MaterialRow {
  id: string;
  post_id: string;
  type: MaterialType;
  drive_file_id: string | null;
  title: string | null;
  alternate_link: string | null;
  thumbnail_url: string | null;
  mime_type: string | null;
  post_category: PostCategory;
  post_title: string | null;
  post_text: string | null;
  post_creation_time: string | null;
}

function toMaterialListItem(row: MaterialRow): MaterialListItem {
  return {
    id: row.id,
    postId: row.post_id,
    type: row.type,
    driveFileId: row.drive_file_id,
    title: row.title,
    alternateLink: row.alternate_link,
    thumbnailUrl: row.thumbnail_url,
    mimeType: row.mime_type,
    postCategory: row.post_category,
    postTitle: row.post_title,
    postText: row.post_text,
    postCreationTime: row.post_creation_time,
    fileType: fileTypeGroup(row.type, row.mime_type),
  };
}

export interface ListCourseMaterialsFilter {
  category?: PostCategory[];
  fileType?: FileTypeGroup[];
  topicId?: string;
  postId?: string;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function listCourseMaterials(
  courseId: string,
  filter: ListCourseMaterialsFilter = {}
): MaterialListItem[] {
  const conditions = ["p.course_id = ?", "p.state = 'PUBLISHED'"];
  const params: string[] = [courseId];

  if (filter.category?.length) {
    conditions.push(`p.category IN (${filter.category.map(() => "?").join(",")})`);
    params.push(...filter.category);
  }
  if (filter.topicId) {
    conditions.push("p.topic_id = ?");
    params.push(filter.topicId);
  }
  if (filter.postId) {
    conditions.push("p.id = ?");
    params.push(filter.postId);
  }
  if (filter.query) {
    const matchingPostIds = searchPosts({ query: filter.query, courseId, category: filter.category });
    if (matchingPostIds.length === 0) return [];
    conditions.push(`p.id IN (${matchingPostIds.map(() => "?").join(",")})`);
    params.push(...matchingPostIds);
  }
  if (filter.dateFrom) {
    conditions.push("date(p.creation_time) >= ?");
    params.push(filter.dateFrom);
  }
  if (filter.dateTo) {
    conditions.push("date(p.creation_time) <= ?");
    params.push(filter.dateTo);
  }

  const rows = db
    .prepare(
      `SELECT m.id, m.post_id, m.type, m.drive_file_id, m.title, m.alternate_link, m.thumbnail_url, m.mime_type,
              p.category as post_category, p.title as post_title, p.text as post_text, p.creation_time as post_creation_time
       FROM materials m
       JOIN posts p ON p.id = m.post_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY p.update_time DESC`
    )
    .all(...params) as unknown as MaterialRow[];

  const items = rows.map(toMaterialListItem);
  if (!filter.fileType?.length) return items;

  const fileTypes = new Set(filter.fileType);
  return items.filter((item) => fileTypes.has(item.fileType));
}

interface SubmissionAttachmentRow {
  id: string;
  post_id: string;
  type: MaterialType;
  drive_file_id: string | null;
  title: string | null;
  alternate_link: string | null;
  thumbnail_url: string | null;
}

export function listSubmissionAttachments(postId: string): SubmissionAttachment[] {
  const rows = db
    .prepare(`SELECT id, post_id, type, drive_file_id, title, alternate_link, thumbnail_url FROM submission_attachments WHERE post_id = ?`)
    .all(postId) as unknown as SubmissionAttachmentRow[];

  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    type: row.type,
    driveFileId: row.drive_file_id,
    title: row.title,
    alternateLink: row.alternate_link,
    thumbnailUrl: row.thumbnail_url,
  }));
}
