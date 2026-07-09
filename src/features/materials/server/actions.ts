"use server";

import { revalidatePath } from "next/cache";
import { syncCourseMaterials } from "@/features/materials/server/materials";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";

export async function syncCourseMaterialsAction(courseId: string) {
  await syncCourseMaterials(courseId, await getCallbackRedirectUri());
  revalidatePath(`/courses/${courseId}`);
}
