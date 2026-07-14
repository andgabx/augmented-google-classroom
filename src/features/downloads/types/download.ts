import type { FileTypeGroup } from "@/features/materials/types/post";

export type DownloadStatus = "QUEUED" | "DOWNLOADING" | "DONE" | "ERROR";

export interface Download {
  materialId: string;
  status: DownloadStatus;
  localPath: string | null;
  errorMessage: string | null;
  attempts: number;
  updatedAt: string;
}

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number | null;
}

export interface DownloadListItem extends Download {
  courseId: string;
  courseName: string;
  materialLabel: string;
  progress: DownloadProgress | null;
}

export interface DownloadedMaterial {
  materialId: string;
  courseId: string;
  courseName: string;
  materialLabel: string;
  localPath: string;
  mimeType: string | null;
  fileType: FileTypeGroup;
  alternateLink: string | null;
  isPreviewable: boolean;
}
