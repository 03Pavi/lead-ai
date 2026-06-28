import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://leadlens.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/search', '/login'],
      disallow: ['/api/', '/dashboard', '/profile', '/lists'], // Protect private routes
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
