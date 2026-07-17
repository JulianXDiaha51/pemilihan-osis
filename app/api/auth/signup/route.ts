import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { getDb } from '../../../../src/lib/db';
import { setSessionCookie, signToken } from '../../../../src/lib/auth';

export async function POST(req: Request) {
  try {
    const { nis, username, password } = await req.json();

    if (!nis || !username || !password) {
      return NextResponse.json({ error: 'NIS, username, dan password wajib diisi' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const db = getDb();

    const student = db
      .prepare('SELECT nis, nama_lengkap, kelas, used_by_user_id FROM students WHERE nis = ?')
      .get(String(nis).trim()) as
      | { nis: string; nama_lengkap: string; kelas: string; used_by_user_id: string | null }
      | undefined;

    if (!student) {
      return NextResponse.json(
        { error: 'NIS tidak terdaftar. Hubungi admin untuk didaftarkan.' },
        { status: 400 }
      );
    }
    if (student.used_by_user_id) {
      return NextResponse.json(
        { error: 'NIS ini sudah dipakai untuk membuat akun.' },
        { status: 400 }
      );
    }

    const usernameTaken = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (usernameTaken) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);

    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO users (id, username, password_hash, role, nama_lengkap, kelas, nis)
         VALUES (?, ?, ?, 'user', ?, ?, ?)`
      ).run(id, username, password_hash, student.nama_lengkap, student.kelas, student.nis);

      db.prepare('UPDATE students SET used_by_user_id = ? WHERE nis = ?').run(id, student.nis);
    });
    tx();

    const token = signToken({ sub: id, username, role: 'user' });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id,
        username,
        role: 'user',
        nama_lengkap: student.nama_lengkap,
        kelas: student.kelas,
        sudah_vote: false,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal daftar' }, { status: 500 });
  }
}
