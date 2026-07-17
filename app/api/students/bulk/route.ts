import { NextResponse } from 'next/server';
import { getDb } from '../../../../src/lib/db';
import { AuthError, requireAdmin } from '../../../../src/lib/auth';

interface ParsedRow {
  nis: string;
  nama_lengkap: string;
  kelas: string;
}

interface ErrorRow {
  line: number;
  raw: string;
  error: string;
}

function parseCsvLine(line: string): string[] {
  const separator = line.includes('\t') ? '\t' : ',';
  return line.split(separator).map((s) => s.trim().replace(/^"|"$/g, ''));
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { data } = await req.json();

    if (typeof data !== 'string' || !data.trim()) {
      return NextResponse.json({ error: 'Data kosong' }, { status: 400 });
    }

    const lines = data
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const valid: ParsedRow[] = [];
    const errors: ErrorRow[] = [];
    const seenNis = new Set<string>();

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const isHeader =
        idx === 0 && /^\s*nis[\s,;\t]/i.test(line);
      if (isHeader) return;

      const parts = parseCsvLine(line);
      if (parts.length < 3) {
        errors.push({ line: lineNum, raw: line, error: 'Format harus NIS,Nama,Kelas' });
        return;
      }

      const [nis, nama, kelas] = parts;
      if (!nis || !nama || !kelas) {
        errors.push({ line: lineNum, raw: line, error: 'Ada field kosong' });
        return;
      }

      if (seenNis.has(nis)) {
        errors.push({ line: lineNum, raw: line, error: 'NIS duplikat di file' });
        return;
      }
      seenNis.add(nis);

      valid.push({ nis, nama_lengkap: nama, kelas });
    });

    const db = getDb();
    const stmt = db.prepare(
      `INSERT INTO students (nis, nama_lengkap, kelas)
       VALUES (?, ?, ?)
       ON CONFLICT(nis) DO UPDATE SET
         nama_lengkap = excluded.nama_lengkap,
         kelas = excluded.kelas
       WHERE students.used_by_user_id IS NULL`
    );

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const tx = db.transaction((rows: ParsedRow[]) => {
      for (const r of rows) {
        const existing = db.prepare('SELECT used_by_user_id FROM students WHERE nis = ?').get(r.nis) as
          | { used_by_user_id: string | null }
          | undefined;

        if (!existing) {
          stmt.run(r.nis, r.nama_lengkap, r.kelas);
          inserted++;
        } else if (existing.used_by_user_id) {
          skipped++;
        } else {
          stmt.run(r.nis, r.nama_lengkap, r.kelas);
          updated++;
        }
      }
    });

    tx(valid);

    return NextResponse.json({
      total_lines: lines.length,
      inserted,
      updated,
      skipped_already_registered: skipped,
      errors,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message || 'Gagal' }, { status: 500 });
  }
}
