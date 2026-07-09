import { db } from "@/lib/db";

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
}

export function saveGoogleCredentials(creds: GoogleCredentials) {
  db.prepare(
    `INSERT INTO google_credentials (id, client_id, client_secret, updated_at)
     VALUES (1, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       client_id = excluded.client_id,
       client_secret = excluded.client_secret,
       updated_at = excluded.updated_at`
  ).run(creds.clientId, creds.clientSecret);
}

export function loadGoogleCredentials(): GoogleCredentials | null {
  const row = db
    .prepare(`SELECT client_id, client_secret FROM google_credentials WHERE id = 1`)
    .get() as { client_id: string; client_secret: string } | undefined;

  if (!row) return null;

  return {
    clientId: row.client_id,
    clientSecret: row.client_secret,
  };
}

export function hasGoogleCredentials(): boolean {
  return loadGoogleCredentials() !== null;
}
