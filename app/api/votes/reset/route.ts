import { NextResponse } from 'next/server';
import { getDb } from '../../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../../src/lib/auth';

export async function DELETE() {
  try {
    await requireAdmin();
    const db = getDb();
    db.transaction(() => {
      db.prepare('DELETE FROM votes').run();
      db.prepare("UPDATE users SET sudah_vote = 0 WHERE role = 'user'").run();
    })();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal reset' }, { status: 500 });
  }
}
