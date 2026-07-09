export type PostCategory = "TAREFA" | "MATERIAL" | "AVISO";

export type PostState = "PUBLISHED" | "DRAFT" | "DELETED";

export interface Topic {
  id: string;
  courseId: string;
  name: string;
  updateTime: string | null;
}

export type MaterialType = "DRIVE_FILE" | "YOUTUBE" | "LINK" | "OTHER";

export interface Material {
  id: string;
  postId: string;
  type: MaterialType;
  driveFileId: string | null;
  title: string | null;
  alternateLink: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
}

export interface Post {
  id: string;
  courseId: string;
  category: PostCategory;
  title: string | null;
  text: string | null;
  state: PostState;
  workType: string | null;
  dueDate: string | null;
  dueTime: string | null;
  topicId: string | null;
  alternateLink: string;
  creationTime: string | null;
  updateTime: string | null;
}

export type FileTypeGroup =
  | "PDF"
  | "WORD"
  | "SLIDES"
  | "SHEETS"
  | "IMAGE"
  | "VIDEO"
  | "LINK"
  | "OTHER";

export interface MaterialListItem extends Material {
  postCategory: PostCategory;
  postTitle: string | null;
  postText: string | null;
  fileType: FileTypeGroup;
}
