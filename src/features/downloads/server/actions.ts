"use server";

import { revalidatePath } from "next/cache";
import { enqueueDownloads } from "@/features/downloads/server/queue";
import { openDownloadedFile, revealDownloadedFile } from "@/features/downloads/server/downloads";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";

export async function enqueueDownloadsAction(materialIds: string[]) {
  if (materialIds.length > 0) {
    enqueueDownloads(materialIds, await getCallbackRedirectUri());
  }
  revalidatePath("/", "layout");
}

export async function revealDownloadedFileAction(materialId: string) {
  revealDownloadedFile(materialId);
}

export async function openDownloadedFileAction(materialId: string) {
  openDownloadedFile(materialId);
}
