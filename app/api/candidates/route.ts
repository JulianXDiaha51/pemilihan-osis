import { NextResponse } from 'next/server';
import { getDb } from '../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../src/lib/auth';
import {
  listCandidates,
  newCandidateId,
  nextNomorUrut,
  saveCandidatePhoto,
} from '../../../src/lib/candidates';

export async function GET() {
  const candidates = listCandidates();
  return NextResponse.json({ candidates });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const nama_ketua = String(form.get('nama_ketua') || '').trim();
    const nama_wakil = String(form.get('nama_wakil') || '').trim();
    const visi = String(form.get('visi') || '').trim();
    const misi = String(form.get('misi') || '').trim();
    const foto = form.get('foto');

    if (!nama_ketua || !nama_wakil || !visi || !misi) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    const id = newCandidateId();
    let foto_path: string | null = null;
    if (foto instanceof File && foto.size > 0) {
      foto_path = await saveCandidatePhoto(foto, id);
    }

    const nomor_urut = nextNomorUrut();
    getDb()
      .prepare(
        `INSERT INTO candidates (id, nomor_urut, nama_ketua, nama_wakil, visi, misi, foto_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, nomor_urut, nama_ketua, nama_wakil, visi, misi, foto_path);

    return NextResponse.json({ id, nomor_urut });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal menambah kandidat' }, { status: 500 });
  }
}
