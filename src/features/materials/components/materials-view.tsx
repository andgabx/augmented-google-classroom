"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ViewItems, ViewToggle, type ViewMode } from "@/components/view-toggle";
import { DOWNLOAD_STATUS_KEY } from "@/features/downloads/constants";
import type { DownloadStatus } from "@/features/downloads/types/download";
import { FILE_TYPE_ICON } from "@/features/materials/lib/file-type-group";
import type { MaterialListItem } from "@/features/materials/types/post";


export interface MaterialWithStatus extends MaterialListItem {
  downloadStatus: DownloadStatus | undefined;
}

function materialLabel(material: MaterialWithStatus, untitled: string): string {
  return material.title ?? material.postTitle ?? material.postText ?? untitled;
}

function statusMeta(
  material: MaterialWithStatus,
  tMaterials: (key: string) => string,
  tDownloadStatus: (key: string) => string,
  locale: string
): string {
  const status = material.downloadStatus
    ? tDownloadStatus(DOWNLOAD_STATUS_KEY[material.downloadStatus])
    : tMaterials("downloadStatusNew");
  const parts = [material.postCategory, material.fileType, status];
  if (material.postCreationTime) {
    parts.push(new Date(material.postCreationTime).toLocaleDateString(locale));
  }
  return parts.join(" · ");
}

export function MaterialsView({
  materials,
  filters,
}: {
  materials: MaterialWithStatus[];
  filters?: React.ReactNode;
}) {
  const t = useTranslations("materials");
  const [view, setView] = useState<ViewMode>("list");

  if (materials.length === 0) {
    return (
      <>
        {filters}
        <p className="text-sm text-muted-foreground">{t("noResults")}</p>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background py-3">
        {filters}
        <ViewToggle value={view} onChange={setView} />
      </div>

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
  const t = useTranslations("materials");
  const tDownloadStatus = useTranslations("downloads.status");
  const locale = useLocale();
  const Icon = FILE_TYPE_ICON[material.fileType];

  return (
    <a
      href={material.alternateLink ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg"
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{materialLabel(material, t("untitled"))}</span>
        <span className="text-sm text-muted-foreground">{statusMeta(material, t, tDownloadStatus, locale)}</span>
      </div>
    </a>
  );
}

function MaterialCard({ material }: { material: MaterialWithStatus }) {
  const t = useTranslations("materials");
  const tDownloadStatus = useTranslations("downloads.status");
  const locale = useLocale();
  const Icon = FILE_TYPE_ICON[material.fileType];
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const showThumbnail = Boolean(material.thumbnailUrl) && !thumbnailFailed;

  return (
    <a
      href={material.alternateLink ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-lg"
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
        <div className="flex items-start gap-1">
          <span className="line-clamp-2 flex-1 text-sm font-medium text-foreground">
            {materialLabel(material, t("untitled"))}
          </span>
          <ArrowRight className="mt-0.5 size-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
        <span className="text-xs text-muted-foreground">{statusMeta(material, t, tDownloadStatus, locale)}</span>
      </div>
    </a>
  );
}
