import { NextRequest, NextResponse } from "next/server";
import { syncCourses } from "@/features/courses/server/courses";

export async function POST(req: NextRequest) {
  const redirectUri = new URL("/api/auth/callback", req.url).toString();

  try {
    await syncCourses(redirectUri);
  } catch {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
