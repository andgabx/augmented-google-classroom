"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, Download, Trash2, XCircle } from "lucide-react";
import { StaggeredDropdown, StaggeredDropdownItem } from "@/components/ui/staggered-dropdown";
import { DOWNLOAD_STATUS_KEY } from "@/features/downloads/constants";
import { openDownloadedFileAction } from "@/features/downloads/server/actions";
import type { DownloadListItem, DownloadStatus } from "@/features/downloads/types/download";

const POLL_INTERVAL_MS = 2000;
const IDLE_POLL_INTERVAL_MS = 15000;
const SCROLL_THRESHOLD = 10;

const STATUS_ICON: Record<DownloadStatus, typeof CheckCircle2 | null> = {
  QUEUED: Clock,
  DOWNLOADING: null,
  DONE: CheckCircle2,
  ERROR: XCircle,
};

const STATUS_ICON_CLASS: Record<DownloadStatus, string> = {
  QUEUED: "text-muted-foreground",
  DOWNLOADING: "",
  DONE: "text-emerald-500",
  ERROR: "text-destructive",
};

export function DownloadsBell({ initialDownloads }: { initialDownloads: DownloadListItem[] }) {
  const t = useTranslations("downloads");
  const tStatus = useTranslations("downloads.status");
  const [downloads, setDownloads] = useState(initialDownloads);
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const visible = clearedAt ? downloads.filter((d) => d.updatedAt > clearedAt) : downloads;
  const activeCount = visible.filter((d) => d.status === "QUEUED" || d.status === "DOWNLOADING").length;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const res = await fetch("/api/downloads");
      const { downloads: latest } = await res.json();
      if (cancelled) return;
      setDownloads(latest);
      const active = latest.some(
        (d: DownloadListItem) => d.status === "QUEUED" || d.status === "DOWNLOADING",
      );
      timer = setTimeout(poll, active ? POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS);
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  function handleClear() {
    setClearedAt(downloads[0]?.updatedAt ?? new Date().toISOString());
  }

  function handleOpen(item: DownloadListItem) {
    if (item.status === "DONE") void openDownloadedFileAction(item.materialId);
  }

  return (
    <StaggeredDropdown
      side="bottom"
      align="end"
      trigger={
        <span className="relative inline-flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted">
          <Download className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-xs leading-none font-medium text-primary-foreground">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          )}
        </span>
      }
      contentClassName={`w-80 overflow-hidden ${visible.length > SCROLL_THRESHOLD ? "max-h-96 overflow-y-auto" : ""}`}
    >
      <li className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span className="text-sm font-semibold text-foreground">{t("title")}</span>
        {visible.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3" />
            {t("clear")}
          </button>
        )}
      </li>
      {visible.length === 0 ? (
        <li className="px-2 py-3 text-sm text-muted-foreground">{t("empty")}</li>
      ) : (
        visible.map((item) => {
          const StatusIcon = STATUS_ICON[item.status];
          return (
            <StaggeredDropdownItem
              key={item.materialId}
              onClick={() => handleOpen(item)}
              className="min-w-0 flex-col items-stretch gap-0.5 whitespace-normal text-left"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{item.materialLabel}</span>
                {StatusIcon && <StatusIcon className={`size-4 shrink-0 ${STATUS_ICON_CLASS[item.status]}`} />}
              </span>
              <span className="block min-w-0 truncate text-xs text-muted-foreground">
                {item.courseName} · {tStatus(DOWNLOAD_STATUS_KEY[item.status])}
                {item.status === "DOWNLOADING" && item.attempts > 1 && ` ${t("attempt", { attempts: item.attempts })}`}
                {item.status === "ERROR" && item.errorMessage && ` — ${item.errorMessage}`}
              </span>
              {item.status === "DOWNLOADING" && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  {item.progress?.totalBytes ? (
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${Math.min(100, (item.progress.downloadedBytes / item.progress.totalBytes) * 100)}%` }}
                    />
                  ) : (
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                  )}
                </div>
              )}
            </StaggeredDropdownItem>
          );
        })
      )}
    </StaggeredDropdown>
  );
}
