"use server";

import { redirect } from "next/navigation";
import {
  deleteGoogleCredentials,
  saveGoogleCredentials,
} from "@/features/auth/server/credentials";
import { deleteRefreshToken } from "@/features/auth/server/tokens";
import { getSession } from "@/features/auth/server/session";

export async function saveGoogleCredentialsAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();

  if (!clientId || !clientSecret) {
    redirect("/setup?error=missing_fields");
  }

  saveGoogleCredentials({ clientId, clientSecret });
  redirect("/api/auth/login");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export async function clearCredentialsAction() {
  const session = await getSession();
  session.destroy();
  deleteRefreshToken();
  deleteGoogleCredentials();
  redirect("/setup");
}
