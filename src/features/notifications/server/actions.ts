"use server";

import { clearNotifications } from "@/features/notifications/server/notifications";

export async function clearNotificationsAction(): Promise<void> {
  clearNotifications();
}
