import { NextResponse } from 'next/server';

// List your supported locales
const locales = ['en', 'es']; // Add more if needed

// List your main route patterns (add more as needed)
const staticRoutes = [
  '/',
  '/about',
  '/contact',
  '/disclaimer',
  '/faq',
  '/calculators',
  '/charts',
];

// List your calculators and charts (add more as needed)
const calculators = [
  'bilirubin-calculator',
  'blood-pressure-calculator',
  'bmi-calculator',
  'dose-calculator',
  'growth-calculator',
  'lab-calculator',
];
const charts = [
  'cdc-growth-chart',
  'infant-cdc-growth-chart',
  'intergrowth-growth-chart',
  'who-growth-chart',
];

const siteUrl = 'https://www.pedimath.com';

export async function GET() {
  let urls: string[] = [];

  // Add static and locale-based routes
  for (const locale of locales) {
    for (const route of staticRoutes) {
      urls.push(`${siteUrl}/${locale}${route === '/' ? '' : route}`);
    }
    // Add calculators
    for (const calc of calculators) {
      urls.push(`${siteUrl}/${locale}/calculators/${calc}`);
    }
    // Add charts
    for (const chart of charts) {
      urls.push(`${siteUrl}/${locale}/charts/${chart}`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
    <url>
      <loc>${url}</loc>
    </url>
  `
    )
    .join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}