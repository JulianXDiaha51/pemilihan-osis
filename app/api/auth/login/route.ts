import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../../src/lib/db';
import { setSessionCookie, signToken } from '../../../../src/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const row = getDb()
      .prepare(
        `SELECT id, username, password_hash, role, nama_lengkap, kelas, sudah_vote
         FROM users WHERE username = ?`
      )
      .get(username) as
      | {
          id: string;
          username: string;
          password_hash: string;
          role: 'admin' | 'user';
          nama_lengkap: string;
          kelas: string;
          sudah_vote: number;
        }
      | undefined;

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const token = signToken({ sub: row.id, username: row.username, role: row.role });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: row.id,
        username: row.username,
        role: row.role,
        nama_lengkap: row.nama_lengkap,
        kelas: row.kelas,
        sudah_vote: row.sudah_vote === 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal login' }, { status: 500 });
  }
}
