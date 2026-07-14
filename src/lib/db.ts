import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "augmented-classroom.db");

// Next.js's build step imports this module from multiple parallel workers
// while collecting page data; the timeout option applies a busy_timeout
// from connection open, so a worker waits instead of failing immediately
// with "database is locked" while another worker holds the write lock.
export const db = new DatabaseSync(dbPath, { timeout: 5000 });

db.exec(`PRAGMA journal_mode = WAL;`);

db.exec(`
  CREATE TABLE IF NOT EXISTS auth_tokens (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    refresh_token TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS app_secrets (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    secret TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS google_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    section TEXT,
    room TEXT,
    course_state TEXT NOT NULL,
    alternate_link TEXT NOT NULL,
    creation_time TEXT,
    update_time TEXT
  );

  CREATE TABLE IF NOT EXISTS periods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS course_teachers (
    course_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    name TEXT NOT NULL,
    photo_url TEXT,
    PRIMARY KEY (course_id, teacher_id)
  );

  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    name TEXT NOT NULL,
    update_time TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT,
    text TEXT,
    state TEXT NOT NULL,
    work_type TEXT,
    due_date TEXT,
    due_time TEXT,
    topic_id TEXT,
    alternate_link TEXT NOT NULL,
    creation_time TEXT,
    update_time TEXT
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    type TEXT NOT NULL,
    drive_file_id TEXT,
    title TEXT,
    alternate_link TEXT,
    thumbnail_url TEXT,
    mime_type TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_materials_post_id ON materials(post_id);
  CREATE INDEX IF NOT EXISTS idx_posts_course_id ON posts(course_id);
  CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id);

  CREATE TABLE IF NOT EXISTS submission_attachments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    type TEXT NOT NULL,
    drive_file_id TEXT,
    title TEXT,
    alternate_link TEXT,
    thumbnail_url TEXT
  );

  CREATE TABLE IF NOT EXISTS downloads (
    material_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    local_path TEXT,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lyceum_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    tenant TEXT NOT NULL,
    ra TEXT NOT NULL,
    internal_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lyceum_session (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    session_data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS notification_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    cleared_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS post_search_fts USING fts5(
    post_id UNINDEXED, course_id UNINDEXED, category UNINDEXED,
    title, body, content
  );

  CREATE TABLE IF NOT EXISTS indexed_materials (
    material_id TEXT PRIMARY KEY
  );
`);

// Next.js's build step imports this module from multiple parallel workers,
// so two workers can both see a column missing and both try to add it;
// the loser hits "duplicate column name", which is fine to ignore here.
function addColumnIfMissing(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (columns.some((c) => c.name === column)) return;
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("duplicate column name")) throw error;
  }
}

addColumnIfMissing("courses", "period_id", "TEXT REFERENCES periods(id)");
addColumnIfMissing("courses", "period_manual", "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("courses", "owner_id", "TEXT");
addColumnIfMissing("posts", "submission_state", "TEXT");
addColumnIfMissing("posts", "late", "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing("lyceum_session", "valid", "INTEGER NOT NULL DEFAULT 1");

interface LegacyPostRow {
  id: string;
  course_id: string;
  category: string;
  title: string | null;
  text: string | null;
}

// Same worker-concurrency situation as addColumnIfMissing above: the INSERT's
// UNIQUE constraint on migrations.name is the atomic claim, so only one
// worker ever runs `migrate`.
function runOnce(name: string, migrate: () => void) {
  try {
    db.prepare(`INSERT INTO migrations (name) VALUES (?)`).run(name);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) return;
    throw error;
  }
  migrate();
}

runOnce("post_search_fts_backfill", () => {
  const hasOldFts = Boolean(
    db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'material_content_fts'`).get()
  );

  const contentByPost = new Map<string, string>();
  if (hasOldFts) {
    const rows = db
      .prepare(
        `SELECT materials.post_id as post_id, material_content_fts.content as content, material_content_fts.material_id as material_id
         FROM material_content_fts JOIN materials ON materials.id = material_content_fts.material_id`
      )
      .all() as unknown as { post_id: string; content: string; material_id: string }[];

    const markIndexed = db.prepare(`INSERT OR IGNORE INTO indexed_materials (material_id) VALUES (?)`);
    for (const row of rows) {
      const existing = contentByPost.get(row.post_id);
      contentByPost.set(row.post_id, existing ? `${existing}\n${row.content}` : row.content);
      markIndexed.run(row.material_id);
    }
  }

  const posts = db.prepare(`SELECT id, course_id, category, title, text FROM posts`).all() as unknown as LegacyPostRow[];
  const insertEntry = db.prepare(
    `INSERT INTO post_search_fts (post_id, course_id, category, title, body, content) VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const post of posts) {
    insertEntry.run(post.id, post.course_id, post.category, post.title ?? "", post.text ?? "", contentByPost.get(post.id) ?? "");
  }

  if (hasOldFts) db.exec(`DROP TABLE material_content_fts`);
});
