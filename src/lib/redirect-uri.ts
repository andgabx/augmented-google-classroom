import { headers } from "next/headers";

export async function getCallbackRedirectUri(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}/api/auth/callback`;
}
