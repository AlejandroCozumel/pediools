# PediMath SEO full audit

**Date:** 2026-09-12
**Scope:** Full-site review of `https://www.pedimath.com`, the Next.js repository, and the authenticated Google Search Console property.
**Business type:** Bilingual pediatric clinical calculation and reference tools.

## Audit summary

The current deployment exposes 34 intended localized URLs (17 route types × English/Spanish). Crawlability and metadata are healthy: an independent crawl fetched all 34 sitemap URLs with HTTP 200, matching canonicals, three hreflang links and valid JSON-LD on the fetched pages.

Search Console shows concentrated demand and a recent decline. In its three-month view the site had about 1,189 clicks from 21,000 impressions (5.7% CTR, average position 28.8). Spanish bilirubin generated 933 clicks/7,653 impressions and Spanish dose 190/5,786—94% of the observed clicks. In the latest 28-day comparison, clicks fell to 308 from 400 (-23%), while impressions rose to 7.11K from 6.29K; CTR fell to 4.3% from 6.4% and average position moved to 35.5 from 26.3.

**Directional SEO health: 66/100, medium confidence.** This is a prioritization score, not a ranking forecast. Technical delivery, metadata and schema are mostly sound; indexing coverage, clinical trust presentation, link authority and the chart entry journey reduce the score.

**Post-audit implementation status:** The working tree now includes parameterized medication and laboratory reference routes generated from the existing data: 13 medication pages and 39 canonical lab-test pages per locale, plus a lab-reference index. The local sitemap contains 140 unique localized URLs. These pages require clinical QA and deployment before they are submitted for indexing; the Search Console property still reflects the prior 34-page production sitemap.

## Findings

| Area | Severity | Confidence | Evidence and impact | Fix |
|---|---|---|---|---|
| Search performance | Warning | Confirmed | GSC shows falling clicks/CTR and worse average position despite higher impressions. | Improve the Spanish bilirubin and dose pages first; compare queries, snippets, countries and devices in 28-day cohorts. |
| Demand concentration | Warning | Confirmed | Those two Spanish pages account for 1,123 of 1,189 three-month clicks. | Make them the first editorial, UX, internal-linking and source-transparency workstream. |
| Indexing coverage | Critical | Confirmed | GSC updated 2026-09-03: 19 not indexed, 18 indexed; five exclusion reasons. | Inspect every exclusion after the September deployment, correct only the underlying URL/canonical problem, then validate fixes. |
| Duplicate/canonical history | Warning | Confirmed, historical | GSC reports 3 “Duplicate without user-selected canonical” and 1 “Duplicate, Google chose different canonical”; Spanish growth inspection (crawled Aug 31) had no user canonical and an unexpected Google-selected value. | Reinspect current HTML after recrawl. Ensure one preferred host, self-canonicals and consistent internal links; do not blindly force a canonical. |
| Crawlability | Pass | Confirmed | All 34 sitemap URLs returned HTTP 200 in the crawl; current pages had `index, follow`, canonicals and hreflang. | Maintain this baseline. |
| Sitemap | Warning | Confirmed | `app/sitemap.ts` and `/api/sitemap` use current generation time for all `lastmod`; GSC still has the old `/api/sitemap` submission (34 discovered pages, last read 2025-07-30). | Consolidate to `/sitemap.xml`, use real substantive modification dates, resubmit and monitor discovered/indexed counts. Google ignores `priority` and `changefreq`. |
| Chart entry journey | Warning | Confirmed source issue | Four chart tools require `weightData`/`heightData` query inputs although directory and sitemap links are bare. Direct visitors can reach a processing/error state. | Make each bare chart URL useful with a default/reference state or visible input form; preserve result parameters only as enhancement. |
| Language switching | Warning | Confirmed source issue | `LanguageSwitcher` replaces pathname without search parameters, dropping completed chart data. | Preserve safe query state when changing locale and test English → Spanish → English. |
| Performance | Info | Confirmed source issue; field data unavailable | Chart clients use a simulated 2.5-second loader; GSC Core Web Vitals says there is not enough usage data and PageSpeed was rate limited. | Tie loading to actual readiness and measure Lighthouse/real-user data after release. No CWV failure is claimed. |
| Content depth | Warning | Confirmed | Calculator pages have useful SSR text, but roughly 214–288 words and generic repeated safety copy; citations exist elsewhere (CHOP lab PDF and medication links) rather than consistently in the SEO block. | Add supported ages, exclusions, method/formula, units, worked example, rounding, interpretation limits, review date/version and primary links per tool. |
| Clinical trust | Warning | Confirmed | Alejandro Zamora is present in metadata and founder schema, but visible credentialed reviewer identity, dated review history and validation policy are absent. | Add truthful owner/reviewer credentials, source versions, review dates, calculation validation/change policy and correction contact. Never invent a reviewer or date. |
| Medication expansion | Warning | Confirmed source risk | Acetaminophen and ibuprofen records omit age; form validation is conditional on an age field. A disclaimer cannot enforce age restrictions. | Clinically review age, indication, concentration, maximum, rounding and jurisdiction safeguards before drug-specific pages. |
| Structured data | Pass / Warning | Confirmed | JSON-LD is syntactically valid and server-rendered; Spanish schema names/descriptions remain English while `inLanguage` is `es`. | Localize schema fields. Do not add fabricated reviews/ratings. FAQ rich results are no longer a current opportunity. |
| Images/social | Warning | Confirmed | Shared OG image is present; footer social links are literal `#`; one crawler found a Cloudflare email-protection URL as 404. | Remove placeholders, verify email link, add page-specific OG images after core fixes. |
| Authority | Critical | Confirmed | GSC Links reports one external link (Product Hunt) and 160 internal links. | Build genuinely useful cited/printable reference assets and pursue relevant pediatric/medical education links. |
| Safety/manual actions | Pass | Confirmed | GSC reports “No issues detected” for both Manual actions and Security issues. | Continue monitoring. |

## Content and growth recommendation

Do not start by generating hundreds of medication, lab, age or sex variants. URL count is not a ceiling on keyword coverage, and Google warns against pages created for every search variation or primarily to manipulate rankings. Improve the two pages already earning clicks, then run reviewed pilots: corrected age, adult-height estimate and a focused BSA page. Pilot 3–5 genuinely distinct lab references only after source, unit, assay and age/sex caveats are reviewed. BSA and PDF/print infrastructure already exist in the repository, so those are packaging opportunities rather than wholly new math.

Infant acetaminophen/ibuprofen pages should wait for clinical guardrails: the current records do not collect age. Do not treat a generic disclaimer as a substitute for validation.

Google removed FAQ rich-result documentation in June 2026 and says FAQ results stopped appearing May 7, 2026. `llms.txt` is also documented as having no positive or negative Google ranking effect. Keep useful FAQ/AI files if desired, but do not make them growth priorities.

## Score basis

| Category | Score | Rationale |
|---|---:|---|
| Technical SEO | 72 | Strong live crawl/HTTP/canonical baseline, reduced by 19 excluded URLs, historical duplicate reports and sitemap drift. |
| Content quality/E-E-A-T | 56 | SSR explanatory content and some citations exist; tool-specific depth, visible review accountability and Spanish editorial quality need work. |
| On-page SEO | 69 | Titles, descriptions, H1s, links and hreflang are present; concentrated pages need stronger intent and interpretation content. |
| Schema | 78 | Valid server-rendered JSON-LD; Spanish localization and rich-result expectations need cleanup. |
| Performance | Insufficient data | No CrUX data; PageSpeed request was rate limited. Artificial chart waits warrant measurement. |
| Images | 68 | OG/social metadata exists; one shared image and placeholder social destinations remain. |
| AI/search readiness | 62 | Crawlable SSR content and robots controls exist; authority and non-commodity clinical explanation are limited. |

## Unknowns and follow-ups

- Whether current September 8 HTML has replaced the older HTML Google crawled August 31–September 3.
- Exact URLs behind the six redirects and one 404 in GSC exclusions after current recrawl.
- Google-selected canonicals for excluded URLs after reinspection.
- Query-level changes for bilirubin and dose beyond visible top rows.
- Real-user CWV data after enough traffic or a reproducible Lighthouse/PageSpeed run.
- Comprehensive clinical correctness and source currency; this audit does not certify medical decisions.

## Sources

- [Google Search documentation updates](https://developers.google.com/search/updates)
- [Google AI features optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content)
- [Google sitemap documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [AAP acetaminophen guidance](https://www.healthychildren.org/English/safety-prevention/at-home/medication-safety/Pages/Acetaminophen-for-Fever-and-Pain.aspx) and [AAP ibuprofen guidance](https://www.healthychildren.org/English/safety-prevention/at-home/medication-safety/Pages/Ibuprofen-for-Fever-and-Pain.aspx)
