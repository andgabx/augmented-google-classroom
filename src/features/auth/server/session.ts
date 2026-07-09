import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { getAppSecret } from "@/lib/secrets";

export interface SessionData {
  isLoggedIn: boolean;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    cookieName: "augmented-classroom-session",
    password: getAppSecret(),
    ttl: 0,
  });
}
