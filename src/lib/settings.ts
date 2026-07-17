import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './db';

const BRANDING_DIR = path.join(process.cwd(), 'public', 'uploads', 'branding');

export const DEFAULT_BRANDING = {
  school_name: 'SMK Cendekia Wanasari',
  short_name: 'Pemilihan OSIS 2026',
  logo_path: null as string | null,
  landing_description:
    'Saatnya menentukan pemimpin OSIS periode berikutnya. Pelajari visi dan misi tiap pasangan calon, lalu berikan suaramu secara online dengan aman dan transparan.',
  footer_text: '© {year} SMK Cendekia Wanasari — Sistem Pemilihan OSIS',
};

export interface Branding {
  school_name: string;
  short_name: string;
  logo_url: string | null;
  landing_description: string;
  footer_text: string;
}

function ensureBrandingDir() {
  if (!fs.existsSync(BRANDING_DIR)) fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

function get(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

function set(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .run(key, value);
}

function toLogoUrl(logoPath: string | null): string | null {
  if (!logoPath) return null;
  return `/uploads/branding/${logoPath}`;
}

export function getBranding(): Branding {
  const school_name = get('school_name') || DEFAULT_BRANDING.school_name;
  const short_name = get('short_name') || DEFAULT_BRANDING.short_name;
  const logo_path = get('logo_path');
  const landing_description =
    get('landing_description') || DEFAULT_BRANDING.landing_description;
  const footer_text = get('footer_text') || DEFAULT_BRANDING.footer_text;
  return {
    school_name,
    short_name,
    logo_url: toLogoUrl(logo_path) || '/cendekia.svg',
    landing_description,
    footer_text,
  };
}

export function updateBrandingText({
  school_name,
  short_name,
  landing_description,
  footer_text,
}: {
  school_name?: string;
  short_name?: string;
  landing_description?: string;
  footer_text?: string;
}) {
  if (school_name && school_name.trim()) set('school_name', school_name.trim());
  if (short_name && short_name.trim()) set('short_name', short_name.trim());
  if (landing_description && landing_description.trim())
    set('landing_description', landing_description.trim());
  if (footer_text && footer_text.trim()) set('footer_text', footer_text.trim());
}

export async function saveLogo(file: File) {
  ensureBrandingDir();
  const type = file.type || '';
  if (!type.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }
  const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(rawExt) ? rawExt : 'png';
  const filename = `logo_${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(BRANDING_DIR, filename), buf);

  const prev = get('logo_path');
  if (prev && prev !== filename) {
    const prevFull = path.join(BRANDING_DIR, prev);
    if (fs.existsSync(prevFull)) {
      try {
        fs.unlinkSync(prevFull);
      } catch {}
    }
  }
  set('logo_path', filename);
  return filename;
}

export function getTheme(): 'light' | 'dark' | 'system' {
  const v = get('theme');
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

export function setTheme(v: 'light' | 'dark' | 'system') {
  set('theme', v);
}
