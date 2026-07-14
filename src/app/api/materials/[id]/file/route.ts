import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MATERIALS_ROOT } from "@/features/downloads/server/downloads";
import { CONTENT_TYPE_FOR_EXTENSION } from "@/features/downloads/lib/preview";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = db.prepare(`SELECT local_path FROM downloads WHERE material_id = ? AND status = 'DONE'`).get(id) as
    | { local_path: string | null }
    | undefined;
  if (!row?.local_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const resolved = path.resolve(row.local_path);
  if (!resolved.startsWith(path.resolve(MATERIALS_ROOT) + path.sep)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(resolved);
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const contentType = CONTENT_TYPE_FOR_EXTENSION[path.extname(resolved).toLowerCase()] ?? "application/octet-stream";
  const stream = Readable.toWeb(fs.createReadStream(resolved)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(path.basename(resolved))}"`,
    },
  });
}
