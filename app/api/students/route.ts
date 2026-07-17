import { NextResponse } from 'next/server';
import { getDb } from '../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../src/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const rows = getDb()
      .prepare(
        `SELECT s.nis, s.nama_lengkap, s.kelas,
                CASE WHEN s.used_by_user_id IS NOT NULL THEN 1 ELSE 0 END AS registered,
                s.used_by_user_id AS user_id,
                u.username AS username
         FROM students s
         LEFT JOIN users u ON u.id = s.used_by_user_id
         ORDER BY s.kelas ASC, s.nama_lengkap ASC`
      )
      .all() as {
        nis: string;
        nama_lengkap: string;
        kelas: string;
        registered: number;
        user_id: string | null;
        username: string | null;
      }[];

    return NextResponse.json({
      students: rows.map((r) => ({ ...r, registered: r.registered === 1 })),
    });
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
    const { nis, nama_lengkap, kelas } = await req.json();

    if (!nis || !nama_lengkap || !kelas) {
      return NextResponse.json({ error: 'NIS, nama, dan kelas wajib diisi' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT nis FROM students WHERE nis = ?').get(String(nis).trim());
    if (existing) {
      return NextResponse.json({ error: 'NIS sudah terdaftar' }, { status: 400 });
    }

    db.prepare(
      `INSERT INTO students (nis, nama_lengkap, kelas) VALUES (?, ?, ?)`
    ).run(String(nis).trim(), String(nama_lengkap).trim(), String(kelas).trim());

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal' }, { status: 500 });
  }
}
