"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface Branding {
  school_name: string;
  short_name: string;
  logo_url: string | null;
  landing_description: string;
  footer_text: string;
}

interface BrandingContextValue {
  branding: Branding;
  refresh: () => Promise<void>;
  setBrandingLocal: (b: Branding) => void;
}

const DEFAULT: Branding = {
  school_name: 'SMK Cendekia Wanasari',
  short_name: 'Pemilihan OSIS 2026',
  logo_url: '/cendekia.svg',
  landing_description:
    'Saatnya menentukan pemimpin OSIS periode berikutnya. Pelajari visi dan misi tiap pasangan calon, lalu berikan suaramu secara online dengan aman dan transparan.',
  footer_text: '© {year} SMK Cendekia Wanasari — Sistem Pemilihan OSIS',
};

const BrandingContext = createContext<BrandingContextValue>({
  branding: DEFAULT,
  refresh: async () => {},
  setBrandingLocal: () => {},
});

export function BrandingProvider({
  initial,
  children,
}: {
  initial?: Branding;
  children: React.ReactNode;
}) {
  const [branding, setBranding] = useState<Branding>(initial || DEFAULT);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.branding) setBranding(data.branding);
    } catch {}
  }, []);

  useEffect(() => {
    if (!initial) refresh();
  }, [initial, refresh]);

  return (
    <BrandingContext.Provider value={{ branding, refresh, setBrandingLocal: setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
