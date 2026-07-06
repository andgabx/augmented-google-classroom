"use server";

import { redirect } from "next/navigation";
import { enqueueDownloads } from "@/features/downloads/server/queue";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";

export async function enqueueDownloadsAction(materialIds: string[]) {
  if (materialIds.length > 0) {
    enqueueDownloads(materialIds, await getCallbackRedirectUri());
  }
  redirect("/downloads");
}
