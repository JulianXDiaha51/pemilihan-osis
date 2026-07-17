import { NextResponse } from 'next/server';
import { getDb } from '../../../../src/lib/db';
import { AuthError, requireUser } from '../../../../src/lib/auth';

export async function GET() {
  try {
    await requireUser();

    const db = getDb();
    const rows = db
      .prepare(
        `SELECT c.id, c.nomor_urut, c.nama_ketua, c.nama_wakil, c.foto_path,
                COALESCE(v.cnt, 0) AS vote_count
         FROM candidates c
         LEFT JOIN (
           SELECT candidate_id, COUNT(*) AS cnt FROM votes GROUP BY candidate_id
         ) v ON v.candidate_id = c.id
         ORDER BY c.nomor_urut ASC`
      )
      .all() as {
        id: string;
        nomor_urut: number;
        nama_ketua: string;
        nama_wakil: string;
        foto_path: string | null;
        vote_count: number;
      }[];

    const total_votes = rows.reduce((sum, r) => sum + r.vote_count, 0);
    const results = rows.map((r) => ({
      ...r,
      foto_url: r.foto_path ? `/uploads/candidates/${r.foto_path}` : null,
      percentage:
        total_votes === 0 ? '0.0' : ((r.vote_count / total_votes) * 100).toFixed(1),
    }));

    return NextResponse.json({ results, total_votes });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal' }, { status: 500 });
  }
}
