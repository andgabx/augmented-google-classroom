"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { StaggeredDropdown, StaggeredDropdownItem } from "@/components/ui/staggered-dropdown";
import { clearNotificationsAction } from "@/features/notifications/server/actions";
import type { FeedPost } from "@/features/feed/types/feed-post";

const VISIBLE_LIMIT = 8;

export function NotificationBell({ initialNotifications }: { initialNotifications: FeedPost[] }) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  function handleClear() {
    setNotifications([]);
    void clearNotificationsAction();
  }

  function openNotification(post: FeedPost) {
    const isTask = post.feedCategory === "TAREFA" || post.feedCategory === "PERGUNTA";
    if (isTask) router.push(`/deadlines/${post.id}`);
    else window.open(post.alternateLink, "_blank", "noopener,noreferrer");
  }

  return (
    <StaggeredDropdown
      side="bottom"
      align="end"
      trigger={
        <span className="relative inline-flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted">
          <Bell className="size-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-xs leading-none font-medium text-destructive-foreground">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </span>
      }
      contentClassName="w-72 overflow-hidden"
    >
      <li className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span className="text-sm font-semibold text-foreground">{t("title")}</span>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {t("clear")}
          </button>
        )}
      </li>
      {notifications.length === 0 ? (
        <li className="px-2 py-3 text-sm text-muted-foreground">{t("empty")}</li>
      ) : (
        notifications.slice(0, VISIBLE_LIMIT).map((post) => (
          <StaggeredDropdownItem
            key={post.id}
            onClick={() => openNotification(post)}
            className="min-w-0 flex-col items-stretch gap-0.5 whitespace-normal text-left"
          >
            <span className="block min-w-0 truncate font-medium text-foreground">
              {post.title ?? post.text ?? t("untitled")}
            </span>
            <span className="block min-w-0 truncate text-xs text-muted-foreground">
              {post.courseName}
              {post.creationTime && ` · ${new Date(post.creationTime).toLocaleDateString(locale)}`}
            </span>
          </StaggeredDropdownItem>
        ))
      )}
    </StaggeredDropdown>
  );
}
