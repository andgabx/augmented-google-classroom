import { google } from "googleapis";
import { createOAuthClient } from "@/lib/google";
import { loadRefreshToken } from "@/features/auth/server/tokens";

async function getAuthClient(redirectUri: string) {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) throw new Error("Not authenticated with Google yet");

  const auth = createOAuthClient(redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

export async function getClassroomClient(redirectUri: string) {
  const auth = await getAuthClient(redirectUri);
  return google.classroom({ version: "v1", auth });
}

export async function getDriveClient(redirectUri: string) {
  const auth = await getAuthClient(redirectUri);
  return google.drive({ version: "v3", auth });
}
