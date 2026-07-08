"use client";

import { useState } from "react";
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
import { ViewItems, ViewToggle, type ViewMode } from "@/components/view-toggle";
import { DOWNLOAD_STATUS_LABEL } from "@/features/downloads/constants";
import type { DownloadStatus } from "@/features/downloads/types/download";
import type { FileTypeGroup, MaterialListItem } from "@/features/materials/types/post";

const FILE_TYPE_ICON: Record<FileTypeGroup, LucideIcon> = {
  PDF: FileText,
  WORD: FileText,
  SLIDES: Presentation,
  SHEETS: SheetIcon,
  IMAGE: ImageIcon,
  VIDEO: Video,
  LINK: LinkIcon,
  OTHER: FileIcon,
};

export interface MaterialWithStatus extends MaterialListItem {
  downloadStatus: DownloadStatus | undefined;
}

function materialLabel(material: MaterialWithStatus): string {
  return material.title ?? material.postTitle ?? material.postText ?? "Sem título";
}

function statusMeta(material: MaterialWithStatus): string {
  const status = material.downloadStatus ? DOWNLOAD_STATUS_LABEL[material.downloadStatus] : "Novo";
  return `${material.postCategory} · ${material.fileType} · ${status}`;
}

export function MaterialsView({ materials }: { materials: MaterialWithStatus[] }) {
  const [view, setView] = useState<ViewMode>("list");

  if (materials.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum material encontrado.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewToggle value={view} onChange={setView} />

      <ViewItems
        view={view}
        items={materials}
        keyFor={(material) => material.id}
        renderListItem={(material) => <MaterialRow material={material} />}
        renderGridItem={(material) => <MaterialCard material={material} />}
      />
    </div>
  );
}

function MaterialRow({ material }: { material: MaterialWithStatus }) {
  const Icon = FILE_TYPE_ICON[material.fileType];

  return (
    <a
      href={material.alternateLink ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted"
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{materialLabel(material)}</span>
        <span className="text-sm text-muted-foreground">{statusMeta(material)}</span>
      </div>
    </a>
  );
}

function MaterialCard({ material }: { material: MaterialWithStatus }) {
  const Icon = FILE_TYPE_ICON[material.fileType];
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const showThumbnail = Boolean(material.thumbnailUrl) && !thumbnailFailed;

  return (
    <a
      href={material.alternateLink ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted"
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
        {showThumbnail ? (
          // Google-hosted thumbnails live on unpredictable domains, so next/image's
          // remotePatterns allowlist isn't a good fit here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={material.thumbnailUrl!}
            alt=""
            className="size-full object-cover"
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <Icon className="size-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="line-clamp-2 text-sm font-medium text-foreground">{materialLabel(material)}</span>
        <span className="text-xs text-muted-foreground">{statusMeta(material)}</span>
      </div>
    </a>
  );
}
