import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

let cached: string | null = null;

export function getAppSecret(): string {
  if (cached) return cached;

  const row = db
    .prepare(`SELECT secret FROM app_secrets WHERE id = 1`)
    .get() as { secret: string } | undefined;

  if (row) {
    cached = row.secret;
    return cached;
  }

  const secret = randomBytes(32).toString("hex");
  db.prepare(`INSERT INTO app_secrets (id, secret) VALUES (1, ?)`).run(secret);
  cached = secret;
  return secret;
}
