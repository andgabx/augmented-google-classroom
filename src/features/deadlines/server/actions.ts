"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { listCourses } from "@/features/courses/server/courses";
import { syncCourseMaterials } from "@/features/materials/server/materials";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";

export interface SyncDeadlinesState {
  success: boolean;
  message: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's signature
export async function syncDeadlinesAction(_prevState: SyncDeadlinesState): Promise<SyncDeadlinesState> {
  const t = await getTranslations("deadlines");
  try {
    const redirectUri = await getCallbackRedirectUri();
    const courses = listCourses({ state: "ACTIVE" });
    for (const course of courses) {
      await syncCourseMaterials(course.id, redirectUri);
    }
    revalidatePath("/deadlines");
    revalidatePath("/courses");
    revalidatePath("/feed");
    return { success: true, message: t("syncSuccess") };
  } catch {
    return { success: false, message: t("syncError") };
  }
}
