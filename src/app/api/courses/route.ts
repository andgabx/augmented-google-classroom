import { NextRequest, NextResponse } from "next/server";
import { listCourses } from "@/features/courses/server/courses";
import type { CourseState } from "@/features/courses/types/course";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state") as CourseState | null;
  const query = req.nextUrl.searchParams.get("q") ?? undefined;

  const courses = listCourses({ state: state ?? undefined, query });
  return NextResponse.json({ courses });
}
