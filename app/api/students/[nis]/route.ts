import { NextResponse } from 'next/server';
import { getDb } from '../../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../../src/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ nis: string }> }) {
  try {
    await requireAdmin();
    const { nis } = await params;

    const db = getDb();
    const row = db.prepare('SELECT used_by_user_id FROM students WHERE nis = ?').get(nis) as
      | { used_by_user_id: string | null }
      | undefined;

    if (!row) {
      return NextResponse.json({ error: 'NIS tidak ditemukan' }, { status: 404 });
    }
    if (row.used_by_user_id) {
      return NextResponse.json(
        { error: 'NIS sudah dipakai untuk daftar. Hapus akunnya dulu jika ingin dihapus.' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM students WHERE nis = ?').run(nis);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal' }, { status: 500 });
  }
}
