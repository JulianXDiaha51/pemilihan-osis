import { NextResponse } from 'next/server';
import { getDb } from '../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../src/lib/auth';

export async function GET() {
  try {
    await requireAdmin();

    const db = getDb();
    const voters = db
      .prepare(
        `SELECT u.id, u.username, u.nama_lengkap, u.kelas, v.created_at AS voted_at
         FROM users u
         INNER JOIN votes v ON v.user_id = u.id
         WHERE u.role = 'user'
         ORDER BY v.created_at DESC`
      )
      .all();

    const non_voters = db
      .prepare(
        `SELECT u.id, u.username, u.nama_lengkap, u.kelas
         FROM users u
         LEFT JOIN votes v ON v.user_id = u.id
         WHERE u.role = 'user' AND v.id IS NULL
         ORDER BY u.nama_lengkap ASC`
      )
      .all();

    return NextResponse.json({
      voters,
      non_voters,
      total_voters: voters.length,
      total_non_voters: non_voters.length,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal' }, { status: 500 });
  }
}
