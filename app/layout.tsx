import type { Metadata, Viewport } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import '../src/styles/globals.css';
import { Toaster } from '../src/components/ui/sonner';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { BrandingProvider } from '../src/components/BrandingProvider';
import { getBranding, getTheme } from '../src/lib/settings';

const siteUrl = 'https://pemilihan-osis.smkcendekia.sch.id';

export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  gif: 'image/gif',
  ico: 'image/x-icon',
};

function buildIconUrl(logoUrl: string | null) {
  const url = logoUrl || '/cendekia.png';
  const ext = (url.split('.').pop() || 'png').toLowerCase();
  const type = MIME_BY_EXT[ext] || 'image/png';

  let version = '';
  if (url.startsWith('/uploads/')) {
    try {
      const full = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
      version = String(fs.statSync(full).mtimeMs);
    } catch {}
  }
  const href = version ? `${url}?v=${version}` : url;
  return { url: href, type };
}

export async function generateMetadata(): Promise<Metadata> {
  const b = getBranding();
  const title = `${b.short_name} — ${b.school_name}`;
  const icon = buildIconUrl(b.logo_url);
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${b.short_name} ${b.school_name}`,
    },
    description: `Sistem ${b.short_name} ${b.school_name}. Ayo pilih calon Ketua dan Wakil OSIS terbaik.`,
    keywords: [
      'Pemilihan OSIS',
      b.short_name,
      b.school_name,
      'Ketua OSIS',
      'Pemilu OSIS',
      'e-voting sekolah',
    ],
    authors: [{ name: b.school_name }],
    icons: {
      icon: [{ url: icon.url, type: icon.type }],
      shortcut: [{ url: icon.url, type: icon.type }],
      apple: [{ url: icon.url, type: icon.type }],
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: siteUrl,
      siteName: `${b.short_name} ${b.school_name}`,
      title,
      description: `Ayo pilih calon Ketua & Wakil OSIS terbaik untuk masa depan ${b.school_name}.`,
      images: [
        {
          url: icon.url,
          width: 512,
          height: 512,
          alt: `Logo ${b.school_name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `Ayo pilih calon Ketua & Wakil OSIS terbaik untuk masa depan ${b.school_name}.`,
      images: [icon.url],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = getBranding();
  const theme = getTheme();
  const htmlClass = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : '';

  return (
    <html lang="id" className={htmlClass} suppressHydrationWarning>
      <body>
        <ThemeProvider initial={theme}>
          <BrandingProvider initial={branding}>
            {children}
            <Toaster position="top-center" richColors />
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
