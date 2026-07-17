import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDb } from './db';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'candidates');

export interface CandidateRow {
  id: string;
  nomor_urut: number;
  nama_ketua: string;
  nama_wakil: string;
  visi: string;
  misi: string;
  foto_path: string | null;
  created_at: string;
}

export interface CandidateWithVotes extends CandidateRow {
  foto_url: string | null;
  vote_count: number;
}

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function toPublicUrl(fotoPath: string | null): string | null {
  if (!fotoPath) return null;
  return `/uploads/candidates/${fotoPath}`;
}

export async function saveCandidatePhoto(file: File, candidateId: string) {
  ensureUploadDir();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `${candidateId}.${ext || 'jpg'}`;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);
  return filename;
}

export function removeCandidatePhoto(fotoPath: string | null) {
  if (!fotoPath) return;
  const full = path.join(UPLOAD_DIR, fotoPath);
  if (fs.existsSync(full)) {
    try {
      fs.unlinkSync(full);
    } catch {}
  }
}

export function listCandidates(): CandidateWithVotes[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*, COALESCE(v.cnt, 0) AS vote_count
       FROM candidates c
       LEFT JOIN (
         SELECT candidate_id, COUNT(*) AS cnt FROM votes GROUP BY candidate_id
       ) v ON v.candidate_id = c.id
       ORDER BY c.nomor_urut ASC`
    )
    .all() as (CandidateRow & { vote_count: number })[];

  return rows.map((r) => ({ ...r, foto_url: toPublicUrl(r.foto_path) }));
}

export function getCandidate(id: string): CandidateWithVotes | null {
  const row = getDb()
    .prepare(
      `SELECT c.*, COALESCE(v.cnt, 0) AS vote_count
       FROM candidates c
       LEFT JOIN (
         SELECT candidate_id, COUNT(*) AS cnt FROM votes GROUP BY candidate_id
       ) v ON v.candidate_id = c.id
       WHERE c.id = ?`
    )
    .get(id) as (CandidateRow & { vote_count: number }) | undefined;
  if (!row) return null;
  return { ...row, foto_url: toPublicUrl(row.foto_path) };
}

export function nextNomorUrut(): number {
  const row = getDb()
    .prepare('SELECT COALESCE(MAX(nomor_urut), 0) AS max FROM candidates')
    .get() as { max: number };
  return row.max + 1;
}

export function newCandidateId(): string {
  return `cand_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}
