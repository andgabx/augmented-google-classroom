import { sealData, unsealData } from "iron-session";
import { db } from "@/lib/db";
import { getAppSecret } from "@/lib/secrets";
import { hasLyceumCredentials } from "@/features/lyceum/server/credentials";

export interface LyceumSession {
  sessionId: string;
  userData: string;
}

export type LyceumConnectionStatus = "connected" | "expired" | "disconnected";

export async function saveLyceumSession(session: LyceumSession) {
  const sealed = await sealData(session, { password: getAppSecret() });
  db.prepare(
    `INSERT INTO lyceum_session (id, session_data, valid, updated_at)
     VALUES (1, ?, 1, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET session_data = excluded.session_data, valid = 1, updated_at = excluded.updated_at`
  ).run(sealed);
}

export async function loadLyceumSession(): Promise<LyceumSession | null> {
  const row = db.prepare(`SELECT session_data FROM lyceum_session WHERE id = 1`).get() as
    | { session_data: string }
    | undefined;
  if (!row) return null;
  return unsealData<LyceumSession>(row.session_data, { password: getAppSecret() });
}

export function deleteLyceumSession() {
  db.prepare(`DELETE FROM lyceum_session WHERE id = 1`).run();
}

export function hasLyceumSession(): boolean {
  return db.prepare(`SELECT 1 FROM lyceum_session WHERE id = 1`).get() !== undefined;
}

// ponytail: set by LyceumApiClient.get() on real calls, so this only self-heals
// opportunistically (next Lyceum call), not via background polling.
export function markLyceumSessionValid() {
  db.prepare(`UPDATE lyceum_session SET valid = 1 WHERE id = 1`).run();
}

export function markLyceumSessionInvalid() {
  db.prepare(`UPDATE lyceum_session SET valid = 0 WHERE id = 1`).run();
}

export function getLyceumConnectionStatus(): LyceumConnectionStatus {
  if (!hasLyceumCredentials()) return "disconnected";
  const row = db.prepare(`SELECT valid FROM lyceum_session WHERE id = 1`).get() as { valid: number } | undefined;
  if (!row) return "disconnected";
  return row.valid ? "connected" : "expired";
}
