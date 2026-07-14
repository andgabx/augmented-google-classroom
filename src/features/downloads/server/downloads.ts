import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { db } from "@/lib/db";
import { getDriveClient } from "@/lib/classroom";
import { fileTypeGroup } from "@/features/materials/lib/file-type-group";
import { isPreviewable } from "@/features/downloads/lib/preview";
import type {
  Download,
  DownloadedMaterial,
  DownloadListItem,
  DownloadProgress,
  DownloadStatus,
} from "@/features/downloads/types/download";
import type { MaterialType } from "@/features/materials/types/post";

export const MATERIALS_ROOT = path.join(process.cwd(), "Materials");

function sanitize(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/[. ]+$/, "").slice(0, 150) || "sem-nome";
}

interface DownloadRow {
  material_id: string;
  status: DownloadStatus;
  local_path: string | null;
  error_message: string | null;
  attempts: number;
  updated_at: string;
}

function toDownload(row: DownloadRow): Download {
  return {
    materialId: row.material_id,
    status: row.status,
    localPath: row.local_path,
    errorMessage: row.error_message,
    attempts: row.attempts,
    updatedAt: row.updated_at,
  };
}

const upsertDownload = db.prepare(`
  INSERT INTO downloads (material_id, status, local_path, error_message, attempts, updated_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(material_id) DO UPDATE SET
    status = excluded.status,
    local_path = excluded.local_path,
    error_message = excluded.error_message,
    attempts = excluded.attempts,
    updated_at = excluded.updated_at
`);

export function markQueued(materialId: string) {
  upsertDownload.run(materialId, "QUEUED", null, null, 0);
  clearDownloadProgress(materialId);
}

export function markDownloading(materialId: string, attempts: number) {
  upsertDownload.run(materialId, "DOWNLOADING", null, null, attempts);
}

export function markDone(materialId: string, localPath: string, attempts: number) {
  upsertDownload.run(materialId, "DONE", localPath, null, attempts);
  clearDownloadProgress(materialId);
}

export function markError(materialId: string, message: string, attempts: number) {
  upsertDownload.run(materialId, "ERROR", null, message, attempts);
  clearDownloadProgress(materialId);
}

export function listDownloadsForCourse(courseId: string): Download[] {
  const rows = db
    .prepare(
      `SELECT d.*
       FROM downloads d
       JOIN materials m ON m.id = d.material_id
       JOIN posts p ON p.id = m.post_id
       WHERE p.course_id = ?
       ORDER BY d.updated_at DESC`
    )
    .all(courseId) as unknown as DownloadRow[];

  return rows.map(toDownload);
}

interface DownloadListRow extends DownloadRow {
  course_id: string;
  course_name: string;
  material_title: string | null;
  post_title: string | null;
  post_text: string | null;
}

export function listAllDownloads(untitledLabel: string): DownloadListItem[] {
  reconcileMissingFiles();

  const rows = db
    .prepare(
      `SELECT d.*, c.id as course_id, c.name as course_name,
              m.title as material_title, p.title as post_title, p.text as post_text
       FROM downloads d
       JOIN materials m ON m.id = d.material_id
       JOIN posts p ON p.id = m.post_id
       JOIN courses c ON c.id = p.course_id
       ORDER BY d.updated_at DESC`
    )
    .all() as unknown as DownloadListRow[];

  return rows.map((row) => ({
    ...toDownload(row),
    courseId: row.course_id,
    courseName: row.course_name,
    materialLabel: row.material_title ?? row.post_title ?? row.post_text ?? untitledLabel,
    progress: downloadProgress.get(row.material_id) ?? null,
  }));
}

const downloadProgress = new Map<string, DownloadProgress>();

export function setDownloadProgress(materialId: string, progress: DownloadProgress) {
  downloadProgress.set(materialId, progress);
}

export function clearDownloadProgress(materialId: string) {
  downloadProgress.delete(materialId);
}

interface DownloadedMaterialRow {
  material_id: string;
  local_path: string;
  course_id: string;
  course_name: string;
  material_title: string | null;
  post_title: string | null;
  post_text: string | null;
  mime_type: string | null;
  type: MaterialType;
  alternate_link: string | null;
}

export function listDownloadedMaterials(untitledLabel: string): DownloadedMaterial[] {
  reconcileMissingFiles();
  reconcileDownloadedFiles();

  const rows = db
    .prepare(
      `SELECT d.material_id, d.local_path, c.id as course_id, c.name as course_name,
              m.title as material_title, p.title as post_title, p.text as post_text,
              m.mime_type, m.type, m.alternate_link
       FROM downloads d
       JOIN materials m ON m.id = d.material_id
       JOIN posts p ON p.id = m.post_id
       JOIN courses c ON c.id = p.course_id
       WHERE d.status = 'DONE' AND d.local_path IS NOT NULL
       ORDER BY d.updated_at DESC`
    )
    .all() as unknown as DownloadedMaterialRow[];

  return rows.map((row) => ({
    materialId: row.material_id,
    courseId: row.course_id,
    courseName: row.course_name,
    materialLabel: row.material_title ?? row.post_title ?? row.post_text ?? untitledLabel,
    localPath: row.local_path,
    mimeType: row.mime_type,
    fileType: fileTypeGroup(row.type, row.mime_type),
    alternateLink: row.alternate_link,
    isPreviewable: isPreviewable(row.local_path),
  }));
}

export function deleteDownload(materialId: string) {
  db.prepare(`DELETE FROM downloads WHERE material_id = ?`).run(materialId);
}

export function openDownloadedFile(materialId: string) {
  const row = db.prepare(`SELECT local_path FROM downloads WHERE material_id = ? AND status = 'DONE'`).get(materialId) as
    | { local_path: string | null }
    | undefined;
  if (!row?.local_path) throw new Error("Material has no downloaded file");
  spawn("open", [row.local_path]);
}

export function revealDownloadedFile(materialId: string) {
  const row = db.prepare(`SELECT local_path FROM downloads WHERE material_id = ? AND status = 'DONE'`).get(materialId) as
    | { local_path: string | null }
    | undefined;
  if (!row?.local_path) throw new Error("Material has no downloaded file");
  spawn("open", ["-R", row.local_path]);
}

const RECONCILE_INTERVAL_MS = 30_000;
let lastMissingFilesCheck = 0;
let lastDownloadedFilesCheck = 0;

function reconcileMissingFiles() {
  // /api/downloads is polled every 2s; skip the sync fs scan unless the throttle window has elapsed.
  const now = Date.now();
  if (now - lastMissingFilesCheck < RECONCILE_INTERVAL_MS) return;
  lastMissingFilesCheck = now;

  const doneRows = db
    .prepare(`SELECT material_id, local_path FROM downloads WHERE status = 'DONE' AND local_path IS NOT NULL`)
    .all() as unknown as { material_id: string; local_path: string }[];

  for (const row of doneRows) {
    if (!fs.existsSync(row.local_path)) deleteDownload(row.material_id);
  }
}

export function reconcileDownloadedFiles() {
  // Called on every "Meus Materiais" page load; skip the sync fs scan unless the throttle window has elapsed.
  const now = Date.now();
  if (now - lastDownloadedFilesCheck < RECONCILE_INTERVAL_MS) return;
  lastDownloadedFilesCheck = now;

  const candidates = db
    .prepare(
      `SELECT m.id, m.type, m.title as material_title, m.mime_type,
              p.title as post_title, p.text as post_text, p.category,
              c.name as course_name, t.name as topic_name
       FROM materials m
       JOIN posts p ON p.id = m.post_id
       JOIN courses c ON c.id = p.course_id
       LEFT JOIN topics t ON t.id = p.topic_id
       LEFT JOIN downloads d ON d.material_id = m.id
       WHERE m.type = 'DRIVE_FILE' AND (d.material_id IS NULL OR d.status != 'DONE')`
    )
    .all() as unknown as MaterialDownloadContext[];

  for (const ctx of candidates) {
    const folder = path.join(
      MATERIALS_ROOT,
      sanitize(ctx.course_name),
      sanitize(ctx.topic_name ?? ctx.post_title ?? ctx.post_text ?? ctx.category)
    );
    if (!fs.existsSync(folder)) continue;
    const baseName = sanitize(ctx.material_title ?? ctx.post_title ?? ctx.id);
    const match = fs.readdirSync(folder).find((name) => name.startsWith(baseName));
    if (match) markDone(ctx.id, path.join(folder, match), 1);
  }
}

interface MaterialDownloadContext {
  id: string;
  type: string;
  drive_file_id: string | null;
  material_title: string | null;
  mime_type: string | null;
  post_title: string | null;
  post_text: string | null;
  category: string;
  course_name: string;
  topic_name: string | null;
}

const selectDownloadContext = db.prepare(`
  SELECT m.id, m.type, m.drive_file_id, m.title as material_title, m.mime_type,
         p.title as post_title, p.text as post_text, p.category,
         c.name as course_name, t.name as topic_name
  FROM materials m
  JOIN posts p ON p.id = m.post_id
  JOIN courses c ON c.id = p.course_id
  LEFT JOIN topics t ON t.id = p.topic_id
  WHERE m.id = ?
`);

export const GOOGLE_EXPORT_MIME: Record<string, string> = {
  "application/vnd.google-apps.document": "application/pdf",
  "application/vnd.google-apps.presentation": "application/pdf",
  "application/vnd.google-apps.spreadsheet":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const EXTENSION_FOR_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

export async function downloadMaterialFile(materialId: string, redirectUri: string): Promise<string> {
  const ctx = selectDownloadContext.get(materialId) as unknown as MaterialDownloadContext | undefined;
  if (!ctx || ctx.type !== "DRIVE_FILE" || !ctx.drive_file_id) {
    throw new Error("Material has no downloadable file");
  }

  const folder = path.join(
    MATERIALS_ROOT,
    sanitize(ctx.course_name),
    sanitize(ctx.topic_name ?? ctx.post_title ?? ctx.post_text ?? ctx.category)
  );
  await fs.promises.mkdir(folder, { recursive: true });

  const drive = await getDriveClient(redirectUri);
  const isGoogleNative = ctx.mime_type?.startsWith("application/vnd.google-apps.") ?? false;

  let baseName = sanitize(ctx.material_title ?? ctx.post_title ?? ctx.id);
  let ext: string;
  let data: NodeJS.ReadableStream;
  let totalBytes: number | null = null;

  if (isGoogleNative) {
    const exportMime = GOOGLE_EXPORT_MIME[ctx.mime_type!] ?? "application/pdf";
    ext = EXTENSION_FOR_MIME[exportMime] ?? ".pdf";
    const res = await drive.files.export(
      { fileId: ctx.drive_file_id, mimeType: exportMime },
      { responseType: "stream" }
    );
    data = res.data as unknown as NodeJS.ReadableStream;
    totalBytes = Number(res.headers["content-length"]) || null;
  } else {
    const existingExt = path.extname(baseName);
    ext = existingExt || EXTENSION_FOR_MIME[ctx.mime_type ?? ""] || "";
    if (existingExt) baseName = baseName.slice(0, -existingExt.length);
    const res = await drive.files.get(
      { fileId: ctx.drive_file_id, alt: "media" },
      { responseType: "stream" }
    );
    data = res.data as unknown as NodeJS.ReadableStream;
    totalBytes = Number(res.headers["content-length"]) || null;
  }

  let filePath = path.join(folder, `${baseName}${ext}`);
  if (fs.existsSync(filePath)) {
    filePath = path.join(folder, `${baseName} (${ctx.drive_file_id})${ext}`);
  }

  let downloadedBytes = 0;
  data.on("data", (chunk: Buffer) => {
    downloadedBytes += chunk.length;
    setDownloadProgress(materialId, { downloadedBytes, totalBytes });
  });

  await pipeline(data, fs.createWriteStream(filePath));
  return filePath;
}
