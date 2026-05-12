# SEO Action Plan

Scope: prioritized fixes for https://www.pedimath.com based on the full-site public SEO audit run on 2026-05-12.

## Immediate Blockers

1. Fix root `robots.txt`.
   - Impact: high. This restores crawler directives and sitemap discovery.
   - Evidence: production `/robots.txt` redirects to `/en/robots.txt`, which returns 404.
   - Implementation: update the `middleware.ts` matcher so `robots.txt` is excluded from localization, or add `app/robots.ts`.
   - Validate: `curl -I https://www.pedimath.com/robots.txt` should return `200`.

2. Expose sitemap at `/sitemap.xml`.
   - Impact: high. This aligns with crawler and tool expectations.
   - Evidence: `/sitemap.xml` redirects to `/en/sitemap.xml`, which returns 404; `/api/sitemap` returns 200.
   - Implementation: add `app/sitemap.ts`, add a rewrite from `/sitemap.xml` to `/api/sitemap`, or move the sitemap route to the conventional path.
   - Validate: `curl -I https://www.pedimath.com/sitemap.xml` should return `200` and `Content-Type: application/xml`.

3. Remove or build sitemap-only listing pages.
   - Impact: high. This prevents submitted 404s in Search Console.
   - Evidence: `/api/sitemap` includes `/en/calculators`, `/en/charts`, `/es/calculators`, `/es/charts`; all return 404.
   - Implementation option A: remove `/calculators` and `/charts` from `staticRoutes` in `app/api/sitemap/route.ts`.
   - Implementation option B: create real index pages for `app/[locale]/calculators/page.tsx` and `app/[locale]/charts/page.tsx`.
   - Validate: every `<loc>` in the sitemap should return 200.

## Quick Wins

4. Fix the broken email-protection link.
   - Impact: medium.
   - Evidence: homepage broken link to `/cdn-cgi/l/email-protection#...`.
   - Implementation: replace the href with `/contact` or a working `mailto:` link.

5. Add `public/llms.txt`.
   - Impact: medium for AI search/GEO.
   - Include: site name, short description, top calculator URLs, chart URLs, disclaimer URL, source standards, update cadence, and contact page.
   - Validate: `curl -I https://www.pedimath.com/llms.txt` should return `200`.

6. Add security headers.
   - Impact: medium trust/security.
   - Add: CSP, X-Frame-Options or CSP `frame-ancestors`, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and HSTS `includeSubDomains` if subdomains are HTTPS-ready.
   - Implementation: `next.config.mjs` `headers()` or edge/CDN rules.

## Strategic Improvements

7. Expand homepage content.
   - Impact: medium/high.
   - Add 300-600 focused words total, not filler.
   - Cover: who the tools are for, what standards are used, clinical limitations, source/update approach, and links to top tools.

8. Strengthen Organization schema.
   - Impact: medium.
   - Evidence: `sameAs: []` in `lib/structured-data.ts`.
   - Add only real profiles: LinkedIn, X/Twitter, GitHub, YouTube, or institutional pages if they exist.

9. Pull Search Console data.
   - Impact: high for prioritization.
   - Requirement: read-only service account JSON with Search Console access.
   - Run: `python3 /Users/usuario1/.codex/skills/seo/scripts/gsc_checker.py https://www.pedimath.com --credentials <creds.json> --json`
   - Use it to prioritize query/page opportunities, CTR rewrites, indexing fixes, and sitemap warnings.

10. Rerun PageSpeed with an API key.
    - Impact: medium/high if CWV issues exist.
    - Run: `python3 /Users/usuario1/.codex/skills/seo/scripts/pagespeed.py https://www.pedimath.com/en --strategy mobile --api-key <key>`
    - Prioritize confirmed LCP, INP, and CLS issues from that output.

## Validation Checklist

- `/robots.txt` returns 200 and contains the sitemap URL.
- `/sitemap.xml` returns 200 XML.
- All sitemap `<loc>` URLs return 200.
- `/llms.txt` returns 200.
- Homepage broken link count is 0.
- Security header score improves from 45/100.
- Search Console submitted sitemap has 0 errors for removed or fixed URLs.
- PageSpeed run completes with real LCP, INP, and CLS values.

