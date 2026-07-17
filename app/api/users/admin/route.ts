import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { getDb } from '../../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../../src/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const admins = getDb()
      .prepare(
        `SELECT id, username, nama_lengkap, created_at
         FROM users WHERE role = 'admin' ORDER BY created_at ASC`
      )
      .all();
    return NextResponse.json({ admins });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { username, password, nama_lengkap } = await req.json();
    if (!username || !password || !nama_lengkap) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare(
      `INSERT INTO users (id, username, password_hash, role, nama_lengkap, kelas)
       VALUES (?, ?, ?, 'admin', ?, '')`
    ).run(id, username, password_hash, nama_lengkap);

    return NextResponse.json({ id, username, nama_lengkap });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal buat admin' }, { status: 500 });
  }
}
