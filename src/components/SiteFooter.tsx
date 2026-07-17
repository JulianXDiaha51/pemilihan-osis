"use client";

import { useBranding } from './BrandingProvider';

export default function SiteFooter({ className = '' }: { className?: string }) {
  const { branding } = useBranding();
  const text = (branding.footer_text || '').replace('{year}', String(new Date().getFullYear()));
  return (
    <footer
      className={`border-t border-gray-200 dark:border-white/[0.06] bg-white/60 dark:bg-[#1a1917]/60 ${className}`}
    >
      <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {text}
      </div>
    </footer>
  );
}
