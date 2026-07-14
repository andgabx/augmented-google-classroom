import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Presentation,
  Sheet as SheetIcon,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { FileTypeGroup, MaterialType } from "@/features/materials/types/post";

export const FILE_TYPE_ICON: Record<FileTypeGroup, LucideIcon> = {
  PDF: FileText,
  WORD: FileText,
  SLIDES: Presentation,
  SHEETS: SheetIcon,
  IMAGE: ImageIcon,
  VIDEO: Video,
  LINK: LinkIcon,
  OTHER: FileIcon,
};

const MIME_GROUPS: Record<string, FileTypeGroup> = {
  "application/pdf": "PDF",
  "application/vnd.google-apps.document": "WORD",
  "application/msword": "WORD",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "WORD",
  "application/vnd.google-apps.presentation": "SLIDES",
  "application/vnd.ms-powerpoint": "SLIDES",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "SLIDES",
  "application/vnd.google-apps.spreadsheet": "SHEETS",
  "application/vnd.ms-excel": "SHEETS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "SHEETS",
};

export function fileTypeGroup(type: MaterialType, mimeType: string | null): FileTypeGroup {
  if (type === "YOUTUBE") return "VIDEO";
  if (type === "LINK") return "LINK";
  if (type === "DRIVE_FILE" && mimeType) {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (MIME_GROUPS[mimeType]) return MIME_GROUPS[mimeType];
  }
  return "OTHER";
}
