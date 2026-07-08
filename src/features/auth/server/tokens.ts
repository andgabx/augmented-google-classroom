import { sealData, unsealData } from "iron-session";
import { db } from "@/lib/db";
import { getAppSecret } from "@/lib/secrets";

export async function saveRefreshToken(refreshToken: string) {
  const sealed = await sealData(refreshToken, { password: getAppSecret() });
  db.prepare(
    `INSERT INTO auth_tokens (id, refresh_token, updated_at)
     VALUES (1, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET refresh_token = excluded.refresh_token, updated_at = excluded.updated_at`
  ).run(sealed);
}

export async function loadRefreshToken(): Promise<string | null> {
  const row = db
    .prepare(`SELECT refresh_token FROM auth_tokens WHERE id = 1`)
    .get() as { refresh_token: string } | undefined;
  if (!row) return null;
  return unsealData<string>(row.refresh_token, { password: getAppSecret() });
}

export function deleteRefreshToken() {
  db.prepare(`DELETE FROM auth_tokens WHERE id = 1`).run();
}
