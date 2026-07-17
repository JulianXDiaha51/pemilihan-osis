import type { Metadata } from 'next';
import Link from 'next/link';
import { listCandidates } from '../src/lib/candidates';
import { getBranding } from '../src/lib/settings';
import AnimatedBackground from '../src/components/AnimatedBackground';

export async function generateMetadata(): Promise<Metadata> {
  const b = getBranding();
  return {
    title: `${b.short_name} — ${b.school_name}`,
    description: b.landing_description,
    alternates: { canonical: '/' },
  };
}

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const candidates = listCandidates();
  const branding = getBranding();
  const footerText = branding.footer_text.replace('{year}', String(new Date().getFullYear()));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${branding.short_name} ${branding.school_name}`,
    description: branding.landing_description,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: branding.school_name,
      address: 'Indonesia',
    },
    organizer: {
      '@type': 'Organization',
      name: `OSIS ${branding.school_name}`,
    },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-[#111110] dark:via-[#111110] dark:to-[#1a1917]">
      <AnimatedBackground />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-center">
        <img
          src={branding.logo_url || '/cendekia.svg'}
          alt={`Logo ${branding.school_name}`}
          className="w-24 h-24 mx-auto object-contain mb-6 animate-float-slow drop-shadow-lg"
        />
        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {branding.short_name}
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">{branding.school_name}</p>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 mb-8 whitespace-pre-line">
          {branding.landing_description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 transition-colors"
          >
            Login untuk Memilih
          </Link>
          <a
            href="#kandidat"
            className="inline-flex items-center justify-center rounded-md border border-indigo-200 dark:border-[#c4a882]/40 bg-white dark:bg-[#1a1917] px-6 py-3 text-indigo-700 dark:text-[#c4a882] hover:bg-indigo-50 dark:hover:bg-[#232220] transition-colors"
          >
            Lihat Kandidat
          </a>
        </div>
      </section>

      <section id="kandidat" className="relative z-10 container mx-auto px-4 pb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-8">
          Pasangan Calon
        </h2>

        {candidates.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Daftar kandidat akan diumumkan segera. Silakan cek kembali nanti.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c: any) => (
              <article
                key={c.id}
                className="bg-white dark:bg-[#1a1917] rounded-lg border-2 border-gray-100 dark:border-white/[0.06] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-56 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-[#232220] dark:to-[#1a1917]">
                  {c.foto_url ? (
                    <img
                      src={c.foto_url}
                      alt={`Pasangan ${c.nama_ketua} dan ${c.nama_wakil}`}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {c.nama_ketua}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">& {c.nama_wakil}</p>
                  {c.visi ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      <span className="font-medium text-indigo-700 dark:text-indigo-400">Visi: </span>
                      {c.visi}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="relative z-10 border-t border-gray-200 dark:border-white/[0.06] bg-white/60 dark:bg-[#1a1917]/60 backdrop-blur">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {footerText}
        </div>
      </footer>
    </main>
  );
}
