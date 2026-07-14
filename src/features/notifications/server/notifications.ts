import { db } from "@/lib/db";
import { listFeed } from "@/features/feed/server/feed";
import type { FeedPost } from "@/features/feed/types/feed-post";

const EPOCH = "1970-01-01T00:00:00.000Z";
const MAX_NOTIFICATIONS = 30;

function getClearedAt(): string {
  const row = db.prepare(`SELECT cleared_at FROM notification_state WHERE id = 1`).get() as
    | { cleared_at: string }
    | undefined;
  return row?.cleared_at ?? EPOCH;
}

export function listNotifications(): FeedPost[] {
  const clearedAt = getClearedAt();
  return listFeed()
    .filter((post) => post.creationTime && post.creationTime > clearedAt)
    .slice(0, MAX_NOTIFICATIONS);
}

export function clearNotifications(): void {
  db.prepare(
    `INSERT INTO notification_state (id, cleared_at) VALUES (1, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET cleared_at = excluded.cleared_at`
  ).run();
}
