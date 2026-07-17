import { NextResponse } from 'next/server';
import { getDb } from '../../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../../src/lib/auth';
import {
  getCandidate,
  removeCandidatePhoto,
  saveCandidatePhoto,
} from '../../../../src/lib/candidates';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ candidate });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = getCandidate(id);
    if (!existing) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

    const form = await req.formData();
    const nama_ketua = String(form.get('nama_ketua') || '').trim();
    const nama_wakil = String(form.get('nama_wakil') || '').trim();
    const visi = String(form.get('visi') || '').trim();
    const misi = String(form.get('misi') || '').trim();
    const foto = form.get('foto');

    if (!nama_ketua || !nama_wakil || !visi || !misi) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    let foto_path = existing.foto_path;
    if (foto instanceof File && foto.size > 0) {
      removeCandidatePhoto(existing.foto_path);
      foto_path = await saveCandidatePhoto(foto, id);
    }

    getDb()
      .prepare(
        `UPDATE candidates
         SET nama_ketua = ?, nama_wakil = ?, visi = ?, misi = ?, foto_path = ?
         WHERE id = ?`
      )
      .run(nama_ketua, nama_wakil, visi, misi, foto_path, id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal update' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = getCandidate(id);
    if (!existing) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

    removeCandidatePhoto(existing.foto_path);
    getDb().prepare('DELETE FROM candidates WHERE id = ?').run(id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal hapus' }, { status: 500 });
  }
}
