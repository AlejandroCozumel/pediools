# PediMath SEO action plan

Prioritized from the 2026-09-12 production crawl, repository review and authenticated Search Console data.

## Implemented in this checkout

- Bare chart URLs now show a useful localized input prompt instead of a missing-data error, and chart calculation pages no longer use a simulated 2.5-second loader.
- Locale switching preserves chart query state.
- Chart hooks skip calculation queries when required inputs are absent.
- Sitemap route definitions are shared; `/api/sitemap` redirects to `/sitemap.xml`, and generated entries no longer use fake current-time `lastmod` values.
- Existing tool JSON-LD is localized for Spanish pages and tool content exposes primary reference links.
- Acetaminophen and ibuprofen medication forms now require age input, including zero-month newborn values.
- Placeholder footer social links were removed.
- Calculator hub and CDC chart metadata now use distinct, descriptive page titles.
- Canonical `/sitemap.xml` is submitted in Search Console and the current production submission reports Success with 34 discovered pages; after deployment, resubmit it so Google discovers the expanded 140-URL sitemap. The legacy `/api/sitemap` entry remains a redirect-compatible record.
- Medication and laboratory reference pages are now generated from the existing JSON data with validated route parameters: 13 medication pages and 39 canonical lab-test pages per locale, plus a laboratory reference index.
- Dose pages preselect the medication and default concentration/frequency; lab pages highlight the requested test after dates are entered. Invalid slugs return 404.

## P0 — this week

1. **Protect the two winning pages.** Review Spanish bilirubin and dose queries, titles, descriptions, first-screen scope and result explanations. Add visible AAP/source links, supported population, units, method, limitations and review ownership. Baseline: 933 and 190 three-month clicks respectively; overall CTR has fallen from 6.4% to 4.3% in the latest 28-day comparison.
2. **Fix chart bare URLs — implemented.** All eight locale/chart detail URLs now show a localized no-input prompt with a link to the growth calculator. Test direct navigation, refresh, back/forward and locale switching after deployment.
3. **Preserve chart state across locales — implemented.** Required encoded query parameters are retained when changing language. Test completed charts in both directions after deployment.
4. **Reconcile GSC exclusions.** Export and inspect all five groups (6 redirects, 3 duplicate-without-canonical, 1 404, 8 crawled-not-indexed, 1 Google-selected-canonical). Correct source/internal-link/canonical causes, then validate fixes and request indexing where appropriate.
5. **Consolidate sitemaps — implemented.** `/sitemap.xml` is the canonical implementation with truthful per-page `lastmod` values, and Search Console reports it as successfully submitted with 34 discovered pages.

## P1 — next 2–4 weeks

6. **Publish clinical accountability.** Add truthful owner/reviewer bios, credentials, dates, source/version history, validation/change policy, correction contact and an accurate privacy page if product data requires it.
7. **Make every tool page answer its task.** Add supported age/gestation, exclusions, inputs/units, method, one verified example, rounding/boundaries, interpretation and primary references. Review Spanish accents and terminology.
8. **Improve contextual links.** Link bilirubin and dose to relevant growth, lab, BP and reference content with descriptive bilingual anchors. Remove `#` social links and verify the email-protection URL.
9. **Remove artificial chart waiting — implemented.** Chart loading is tied to query readiness; run mobile Lighthouse/PageSpeed and monitor real-user signals after deployment.

## P2 — validated growth pilots

10. **Corrected-age calculator (EN/ES):** explain chronological, corrected and postmenstrual age, boundaries and reviewed limitations; connect to growth tools.
11. **Adult-height estimate (EN/ES):** show uncertainty and explain that it is an estimate, not bone-age prediction or a promise.
12. **Standalone BSA page (EN/ES):** extract existing tested BSA capability without implying a prescription.
13. **Lab reference pages — implementation complete; clinical QA pending:** 39 canonical test pages are generated from the source data, with units, age/sex handling and CHOP links. Reconcile source revisions and review representative pages before promotion.
14. **Medication pages — implementation complete; clinical review pending:** 13 medication pages preselect the existing calculator data and expose source links. Review indication, concentration, maximum, rounding and jurisdiction safeguards before publishing consumer dosing pages.

## P3 — authority and measurement

15. Create cited, printable reference assets and pursue relevant pediatric, medical-education and clinician-community distribution. GSC currently reports only one external link.
16. Monitor weekly for 90 days: indexed/excluded URLs, query/page CTR, position, country/device, sitemap discovery, manual actions/security and external links. Compare like-for-like 28-day windows and annotate releases.

## Definition of done

- All eight locale/chart entry URLs show a useful no-input state.
- GSC exclusion examples are inspected and duplicate/canonical/redirect counts trend down after validation.
- `/sitemap.xml` is submitted, canonical-only and uses truthful `lastmod` values.
- Bilirubin and dose pages have source-specific reviewed content and measured CTR/position experiments.
- Every clinical page states scope, source version, review accountability and limitations.
- New pages launch as reviewed pilots with a defined user task and 28-day measurement plan.
