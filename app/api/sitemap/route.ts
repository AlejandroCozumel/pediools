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

// Helper function to get priority based on route importance
function getPriority(route: string): string {
  if (route === '/') return '1.0';
  if (route.includes('/calculators/') || route.includes('/charts/')) return '0.8';
  if (route === '/calculators' || route === '/charts') return '0.7';
  return '0.6';
}

// Helper function to get change frequency
function getChangeFreq(route: string): string {
  if (route === '/') return 'weekly';
  if (route.includes('/calculators/') || route.includes('/charts/')) return 'monthly';
  return 'monthly';
}

export async function GET() {
  let urls: Array<{url: string, lastmod: string, priority: string, changefreq: string}> = [];

  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Add static and locale-based routes
  for (const locale of locales) {
    for (const route of staticRoutes) {
      const fullRoute = route === '/' ? '' : route;
      const url = `${siteUrl}/${locale}${fullRoute}`;
      urls.push({
        url,
        lastmod: now,
        priority: getPriority(route),
        changefreq: getChangeFreq(route)
      });
    }

    // Add calculators
    for (const calc of calculators) {
      const url = `${siteUrl}/${locale}/calculators/${calc}`;
      urls.push({
        url,
        lastmod: now,
        priority: getPriority(`/calculators/${calc}`),
        changefreq: getChangeFreq(`/calculators/${calc}`)
      });
    }

    // Add charts
    for (const chart of charts) {
      const url = `${siteUrl}/${locale}/charts/${chart}`;
      urls.push({
        url,
        lastmod: now,
        priority: getPriority(`/charts/${chart}`),
        changefreq: getChangeFreq(`/charts/${chart}`)
      });
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls
    .map(({ url, lastmod, priority, changefreq }) => {
      // Extract path for hreflang alternates
      const path = url.replace(`${siteUrl}/en`, '').replace(`${siteUrl}/es`, '') || '/';
      const currentLocale = url.includes('/es/') || url.endsWith('/es') ? 'es' : 'en';

      return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
      ${locales.map(locale => {
        const altUrl = locale === 'en'
          ? `${siteUrl}/en${path === '/' ? '' : path}`
          : `${siteUrl}/es${path === '/' ? '' : path}`;
        return `<xhtml:link rel="alternate" hreflang="${locale}" href="${altUrl}" />`;
      }).join('\n      ')}
      <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/en${path === '/' ? '' : path}" />
    </url>`;
    })
    .join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  });
}