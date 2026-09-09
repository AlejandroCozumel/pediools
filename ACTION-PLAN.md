# PediMath SEO Action Plan

## Completed

1. Removed duplicate title branding.
   - Rendered titles now use one suffix, for example `Growth Percentile Calculator | PediMath`.

2. Expanded key meta descriptions.
   - Representative rendered descriptions now fall in the 120-160 character range.

3. Added disclaimer metadata and H1.
   - `/en/disclaimer` now renders `Medical Calculator Disclaimer | PediMath` with one H1.

4. Added semantic H1s to calculator and chart detail pages.
   - Verified on `/en/calculators/growth-calculator` and `/en/charts/cdc-growth-chart`.

5. Fixed non-localized disclaimer links.
   - Rendered links now point to `/en/disclaimer` on English pages.

6. Removed unsupported `WebSite` `SearchAction`.
   - Homepage JSON-LD no longer advertises search behavior that the site does not provide.

7. Replaced placeholder support pages with real content.
   - About, FAQ, and Contact now include localized, crawlable content.

8. Added static explanatory content to tool pages.
   - Calculator and chart pages now include reference, input, safety, and related-tool sections.

## Recommended Next Checks After Deploy

1. Run PageSpeed Insights mobile for the homepage and the heaviest calculator pages.
2. Crawl production for broken links and redirect chains.
3. Submit the updated sitemap in Google Search Console if indexing needs to be accelerated.
4. Consider page-specific OG images for the most important calculators.
