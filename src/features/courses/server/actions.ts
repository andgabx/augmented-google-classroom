"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { setCoursePeriod, syncCourses } from "@/features/courses/server/courses";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";

export interface SyncCoursesState {
  success: boolean;
  message: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's signature
export async function syncCoursesAction(_prevState: SyncCoursesState): Promise<SyncCoursesState> {
  const t = await getTranslations("courses");
  try {
    await syncCourses(await getCallbackRedirectUri());
    revalidatePath("/courses");
    return { success: true, message: t("syncSuccess") };
  } catch {
    return { success: false, message: t("syncError") };
  }
}

const coursePeriodSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  term: z.enum(["1", "2"]),
});

export interface SetCoursePeriodState {
  success: boolean;
  message: string;
}

export async function setCoursePeriodAction(
  courseId: string,
  _prevState: SetCoursePeriodState,
  formData: FormData
): Promise<SetCoursePeriodState> {
  const t = await getTranslations("courses");
  const parsed = coursePeriodSchema.safeParse({
    year: formData.get("year"),
    term: formData.get("term"),
  });
  if (!parsed.success) {
    return { success: false, message: t("periodInvalid") };
  }

  const period = `${parsed.data.year}.${parsed.data.term}`;
  setCoursePeriod(courseId, period);
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  return { success: true, message: t("periodSaved", { period }) };
}
