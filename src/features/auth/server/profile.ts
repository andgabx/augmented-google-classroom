import { google } from "googleapis";
import type { OAuth2Client } from "googleapis-common";

export interface GoogleProfile {
  name: string | null;
  email: string | null;
  picture: string | null;
}

export async function fetchGoogleProfile(auth: OAuth2Client): Promise<GoogleProfile> {
  const oauth2 = google.oauth2({ version: "v2", auth });
  const { data } = await oauth2.userinfo.get();
  return {
    name: data.name ?? null,
    email: data.email ?? null,
    picture: data.picture ?? null,
  };
}
