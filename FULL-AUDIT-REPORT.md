# Full SEO Audit Report

Audit date: 2026-05-12  
Scope: full-site public SEO audit for https://www.pedimath.com, with homepage crawl starting at https://www.pedimath.com/en and sitemap checks against https://www.pedimath.com/api/sitemap.  
Business type detected: pediatric medical calculator and clinical reference tool site.  
Score band: Needs Improvement. The generated dashboard scored 61/100, mainly penalized by crawl discovery defects, missing security headers, missing llms.txt, thin homepage copy, and unavailable PageSpeed data.

## Evidence Collected

- Production homepage fetch: `https://www.pedimath.com/` redirects to `https://www.pedimath.com/en` and returns HTTP 200.
- Crawled internal pages: 13 pages found from the English homepage.
- Sitemap: `/api/sitemap` returns HTTP 200 XML with 34 URLs.
- Robots: `/robots.txt` redirects to `/en/robots.txt`; `/en/robots.txt` returns HTTP 404.
- Conventional sitemap: `/sitemap.xml` redirects to `/en/sitemap.xml`; `/en/sitemap.xml` returns HTTP 404.
- Hreflang: English, Spanish, and x-default tags are present on the homepage; Spanish return tag confirmed.
- Open Graph/Twitter: social metadata scored 92/100; OG image exists and returns HTTP 200.
- Security headers: score 45/100.
- PageSpeed/Core Web Vitals: PageSpeed API was rate limited, so no reliable LCP/INP/CLS values were captured.
- Search Console: verification file exists at `public/google5db106a834e58c7c.html`, but no local Search Console API credentials were found.

## Top Issues

1. Root `robots.txt` is inaccessible in production.
2. Conventional `/sitemap.xml` is inaccessible and redirects to a localized 404.
3. The XML sitemap includes confirmed 404 URLs.
4. Homepage has a broken internal email-protection link.
5. Homepage copy is thin for a medical tool site.

## Top Opportunities

1. Fix crawler discovery first: root robots + root sitemap + remove sitemap 404s.
2. Add `llms.txt` to guide AI crawlers and answer engines toward calculators, chart tools, and clinical disclaimers.
3. Strengthen entity/E-E-A-T signals with real `sameAs` profiles and more explicit source/clinical-scope copy.
4. Add security headers in `next.config.mjs` or at the edge.
5. Pull GSC query/page data once credentials are available to prioritize content expansion by actual impressions.

## Findings Table

| Area | Severity | Confidence | Finding | Evidence | Fix |
|---|---|---:|---|---|---|
| Crawlability | Critical | Confirmed | Production `robots.txt` is not accessible at the root. | `robots_checker` returned HTTP 404 for `/robots.txt`; `curl -I` showed `/robots.txt` 307 redirects to `/en/robots.txt`, which returns HTTP 404. Local file exists at `public/robots.txt`. | Exclude `robots.txt` from locale middleware or implement `app/robots.ts` so `https://www.pedimath.com/robots.txt` returns HTTP 200. Relevant matcher: `middleware.ts:8`. |
| Sitemap | Critical | Confirmed | Conventional sitemap endpoint redirects to a localized 404. | `/sitemap.xml` returned 307 to `/en/sitemap.xml`; `/en/sitemap.xml` returned HTTP 404. | Add `app/sitemap.ts`, a `public/sitemap.xml`, or a rewrite so `/sitemap.xml` returns the same XML as `/api/sitemap`. |
| Sitemap | Critical | Confirmed | XML sitemap includes URLs that return 404. | `/api/sitemap` lists `/en/calculators`, `/en/charts`, `/es/calculators`, and `/es/charts`; each returned HTTP 404. These are added in `app/api/sitemap/route.ts:7`. | Remove nonexistent listing routes from `staticRoutes` or create real index pages for calculators and charts. |
| Links | Warning | Confirmed | Homepage has one broken internal link. | `broken_links` found `/cdn-cgi/l/email-protection#...` returning 404 with anchor `[email protected]`. | Replace the Cloudflare-protected email href with `/contact` or a working `mailto:` link. |
| Security | Warning | Confirmed | Five recommended security headers are missing. | `security_headers` score: 45/100. Missing CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. HSTS lacks `includeSubDomains`. | Add headers in `next.config.mjs` or Cloudflare/Vercel edge config. |
| AI Search | Warning | Confirmed | No `llms.txt` or `llms-full.txt` is available. | `llms_txt_checker` returned HTTP 404 for `/llms.txt` and no `llms-full.txt`. | Add `public/llms.txt` with site summary, top tool URLs, medical disclaimer, update cadence, and contact/source information. |
| Content | Warning | Confirmed | Homepage has thin crawlable text. | `parse_html` and `readability` measured 97 words on `/en`. | Add concise sections explaining audience, tools, standards used, limitations, and links to high-value calculators/charts. |
| Entity SEO | Warning | Confirmed | Organization schema has an empty `sameAs` array. | `parse_html` found Organization schema with `sameAs: []`; source is `lib/structured-data.ts:27`. | Add only real, authoritative profile URLs to `sameAs`. Do not add placeholder Wikipedia/Wikidata URLs. |
| Performance | Info | Hypothesis | Core Web Vitals could not be measured in this run. | `pagespeed.py` was rate limited by Google API without an API key. | Rerun with a PageSpeed API key or use Search Console Core Web Vitals field data. |
| Search Console | Info | Confirmed | Search Console verification exists, but API data was unavailable locally. | `public/google5db106a834e58c7c.html` exists; no GSC credentials/env vars were found. | Provide a read-only Search Console service account JSON and run `gsc_checker.py`. |

## Category Notes

### Technical SEO

The site is indexable at the page level: homepage meta robots is `index, follow`, canonical is `https://www.pedimath.com/en`, and the English homepage returns HTTP 200. The main technical failure is crawl-discovery plumbing around root-level files. The current middleware matcher in `middleware.ts` localizes extensionless paths, which catches `robots.txt` and `sitemap.xml` requests and sends them to localized 404s.

The live sitemap at `/api/sitemap` is valid XML and includes hreflang alternates, but it is not exposed at the conventional path and includes four confirmed nonexistent listing pages. Search Console will likely show these as submitted-but-not-found if `/api/sitemap` has been submitted.

### Content Quality and E-E-A-T

The homepage is very thin at 97 words. For a medical calculator product, that is not enough context for search engines or AI systems to understand authority, intended audience, source standards, or safety constraints. The site does include medical disclaimers and calculator-specific pages, but the home page should summarize those trust signals and route users clearly.

Recommended additions: short "For clinicians and caregivers" positioning, standards used (CDC, WHO, AAP where applicable), "not a substitute for clinical judgment" disclaimer, update/review policy, and links to the highest-value calculators.

### On-Page SEO

Homepage basics pass: title, meta description, H1, canonical, Open Graph, Twitter card, and hreflang are present. Social metadata is strong. One minor issue is duplicated navigation anchor text such as `AboutAbout`, which likely comes from responsive duplicate nav labels in the rendered HTML. That is lower priority than crawler discovery.

### Schema and Entity

The homepage includes valid `WebSite` and `Organization` JSON-LD. Tool pages include `WebApplication` and breadcrumb schema. The main schema opportunity is entity strengthening: `sameAs` is empty in `lib/structured-data.ts`, which limits brand reconciliation. Add only real profiles you control or that are authoritative.

### Performance

No reliable Core Web Vitals values were captured because PageSpeed Insights rate limited the unauthenticated request. Treat the dashboard's 0 performance score as "not measured", not as a confirmed failed CWV score.

### Images

The homepage uses one SVG logo with alt text and dimensions. The Open Graph image exists and is lightweight enough for social preview use. No high-priority image SEO issue was confirmed from the homepage crawl.

### AI Search Readiness

The site has strong raw material for AI answers because it provides specific pediatric tools, but it lacks `llms.txt` and has thin homepage context. Add an AI-readable site map that points to calculators, charts, disclaimer, and source standards.

## Environment Limitations

- Search Console performance, indexing, submitted sitemap, and Core Web Vitals field data were not accessible because no GSC API credentials were found locally.
- PageSpeed Insights was rate limited without an API key.
- The audit used public production evidence and local source inspection, not private GSC query data.

## Generated Artifacts

- `FULL-AUDIT-REPORT.md`
- `ACTION-PLAN.md`
- `SEO-REPORT.html`

