import path from "node:path";

export const CONTENT_TYPE_FOR_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const PREVIEWABLE_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".webm", ".mov"]);

export function isPreviewable(localPath: string): boolean {
  return PREVIEWABLE_EXTENSIONS.has(path.extname(localPath).toLowerCase());
}
