import { NextRequest, NextResponse } from "next/server";
import { createOAuthClient, getAuthUrl } from "@/lib/google";
import { hasGoogleCredentials } from "@/features/auth/server/credentials";
import { saveRefreshToken } from "@/features/auth/server/tokens";
import { getSession } from "@/features/auth/server/session";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/auth/[...google]">
) {
  const { google } = await ctx.params;
  const action = google?.[0];
  const redirectUri = new URL("/api/auth/callback", req.url).toString();

  if (action === "login") {
    if (!hasGoogleCredentials()) {
      return NextResponse.redirect(new URL("/setup", req.url));
    }
    return NextResponse.redirect(getAuthUrl(redirectUri));
  }

  if (action === "callback") {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/?error=missing_code", req.url));
    }

    const client = createOAuthClient(redirectUri);
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/?error=no_refresh_token", req.url));
    }

    await saveRefreshToken(tokens.refresh_token);

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
