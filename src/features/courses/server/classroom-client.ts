import { google } from "googleapis";
import { createOAuthClient } from "@/lib/google";
import { loadRefreshToken } from "@/features/auth/server/tokens";

export async function getClassroomClient(redirectUri: string) {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) throw new Error("Not authenticated with Google yet");

  const auth = createOAuthClient(redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.classroom({ version: "v1", auth });
}
