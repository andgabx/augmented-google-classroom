"use server";

import { redirect } from "next/navigation";
import { saveGoogleCredentials } from "@/features/auth/server/credentials";

export async function saveGoogleCredentialsAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();

  if (!clientId || !clientSecret) {
    redirect("/setup?error=missing_fields");
  }

  saveGoogleCredentials({ clientId, clientSecret });
  redirect("/api/auth/login");
}
