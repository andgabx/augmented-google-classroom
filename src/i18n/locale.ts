"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type Locale = "pt" | "en";

const COOKIE_NAME = "locale";
const DEFAULT_LOCALE: Locale = "pt";

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "en" ? "en" : DEFAULT_LOCALE;
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale);
  revalidatePath("/", "layout");
}
