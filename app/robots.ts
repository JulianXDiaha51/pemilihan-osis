import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login'],
        disallow: ['/dashboard'],
      },
    ],
    sitemap: 'https://pemilihan-osis.smkcendekia.sch.id/sitemap.xml',
  };
}
