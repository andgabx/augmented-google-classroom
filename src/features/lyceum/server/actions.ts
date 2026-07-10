"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteLyceumCredentials, saveLyceumCredentials } from "@/features/lyceum/server/credentials";
import { deleteLyceumSession, saveLyceumSession } from "@/features/lyceum/server/session";
import { runLyceumLogin } from "@/features/lyceum/server/login";

export async function connectLyceumAction(formData: FormData) {
  const tenant = String(formData.get("tenant") ?? "").trim().toLowerCase();

  if (!tenant) {
    redirect("/settings?error=missing_tenant");
  }

  try {
    const result = await runLyceumLogin(tenant);
    saveLyceumCredentials({ tenant: result.tenant, ra: result.ra, internalId: result.internalId });
    await saveLyceumSession({ sessionId: result.sessionId, userData: result.userData });
  } catch {
    redirect("/settings?error=login_failed");
  }

  revalidatePath("/", "layout");
  redirect("/settings");
}

export async function disconnectLyceumAction() {
  deleteLyceumSession();
  deleteLyceumCredentials();
  revalidatePath("/", "layout");
  redirect("/settings");
}
