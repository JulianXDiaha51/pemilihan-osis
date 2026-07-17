import { NextResponse } from 'next/server';
import { getDb } from '../../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../../src/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun sendiri' },
        { status: 400 }
      );
    }

    const db = getDb();
    const target = db
      .prepare('SELECT id, role, username, nama_lengkap FROM users WHERE id = ?')
      .get(id) as { id: string; role: 'admin' | 'user'; username: string; nama_lengkap: string } | undefined;

    if (!target) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (target.role === 'admin') {
      const { cnt } = db
        .prepare(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'`)
        .get() as { cnt: number };
      if (cnt <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus admin terakhir' },
          { status: 400 }
        );
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return NextResponse.json({
      deleted: {
        id: target.id,
        username: target.username,
        nama_lengkap: target.nama_lengkap,
        role: target.role,
      },
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal hapus user' }, { status: 500 });
  }
}
