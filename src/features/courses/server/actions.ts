"use server";

import { revalidatePath } from "next/cache";
import { syncCourses } from "@/features/courses/server/courses";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";

export async function syncCoursesAction() {
  await syncCourses(await getCallbackRedirectUri());
  revalidatePath("/courses");
}
