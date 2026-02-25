import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://leananglestudio.com'; // Adjust to default domain in production

  const routes = [
    '',
    '/catalog',
    '/catalog?category=camera',
    '/catalog?category=audio',
    '/catalog?category=mount',
    '/cart',
    '/auth/login',
    '/auth/register',
    '/contact',
    '/faq',
    '/how-it-works',
    '/terms',
    '/privacy-policy',
    '/shipping-delivery',
    '/cancellation-refund',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
