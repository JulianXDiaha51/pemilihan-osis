import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDb } from '../../../src/lib/db';
import { AuthError, requireUser } from '../../../src/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== 'user') {
      return NextResponse.json({ error: 'Hanya siswa yang dapat memilih' }, { status: 403 });
    }
    if (user.sudah_vote) {
      return NextResponse.json({ error: 'Anda sudah melakukan voting' }, { status: 400 });
    }

    const { candidate_id } = await req.json();
    if (!candidate_id) {
      return NextResponse.json({ error: 'candidate_id wajib diisi' }, { status: 400 });
    }

    const db = getDb();
    const candidate = db
      .prepare('SELECT id FROM candidates WHERE id = ?')
      .get(candidate_id);
    if (!candidate) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan' }, { status: 404 });
    }

    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO votes (id, user_id, candidate_id) VALUES (?, ?, ?)`
      ).run(crypto.randomUUID(), user.id, candidate_id);
      db.prepare('UPDATE users SET sudah_vote = 1 WHERE id = ?').run(user.id);
    });

    try {
      tx();
    } catch (e: any) {
      if (String(e.message).includes('UNIQUE')) {
        return NextResponse.json({ error: 'Anda sudah melakukan voting' }, { status: 400 });
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal voting' }, { status: 500 });
  }
}
