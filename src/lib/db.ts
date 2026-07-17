import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

let db: Database.Database | null = null;

function getDbPath() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'app.db');
}

function ensureUploadsDir() {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'candidates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      nama_lengkap TEXT NOT NULL,
      kelas TEXT NOT NULL DEFAULT '',
      nis TEXT UNIQUE,
      sudah_vote INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      nomor_urut INTEGER NOT NULL,
      nama_ketua TEXT NOT NULL,
      nama_wakil TEXT NOT NULL,
      visi TEXT NOT NULL,
      misi TEXT NOT NULL,
      foto_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      candidate_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      nis TEXT PRIMARY KEY,
      nama_lengkap TEXT NOT NULL,
      kelas TEXT NOT NULL,
      used_by_user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_students_kelas ON students(kelas);
  `);

  const cols = database.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
  if (!cols.some((c) => c.name === 'nis')) {
    database.exec(`ALTER TABLE users ADD COLUMN nis TEXT`);
    database.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nis ON users(nis) WHERE nis IS NOT NULL`);
  }
}

function seedAdmin(database: Database.Database) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const nama = process.env.ADMIN_NAMA || 'Administrator OSIS';

  const existing = database
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username);
  if (existing) return;

  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 10);
  database
    .prepare(
      `INSERT INTO users (id, username, password_hash, role, nama_lengkap, kelas)
       VALUES (?, ?, ?, 'admin', ?, '')`
    )
    .run(id, username, hash, nama);
}

export function getDb() {
  if (!db) {
    ensureUploadsDir();
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
    seedAdmin(db);
  }
  return db;
}
