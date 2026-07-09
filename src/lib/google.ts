import { OAuth2Client } from "googleapis-common";
import { loadGoogleCredentials } from "@/features/auth/server/credentials";

const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

export function createOAuthClient(redirectUri: string) {
  const creds = loadGoogleCredentials();
  if (!creds) throw new Error("Google credentials not configured yet");

  return new OAuth2Client({
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    redirectUri,
  });
}

export function getAuthUrl(redirectUri: string) {
  return createOAuthClient(redirectUri).generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}
