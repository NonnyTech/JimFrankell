# Google search launch

Primary domain configured: `https://jimfrankell.com`. The production build enables indexing for public pages and generates `https://jimfrankell.com/sitemap.xml`. Deploy the rebuilt site before submitting this sitemap to Google Search Console. Domain/DNS connection and deployment are not performed by the build.

## Required domain setting

Set `websiteUrl` in `src/config/businessConfig.js` to the final public HTTPS origin (no page path), then run `npm run build` and deploy `dist` using the provided Vercel or Netlify configuration. Rebuild whenever products or business information change.

**Until the domain is set, every page is deliberately `noindex` and the sitemap is empty.** This prevents preview URLs and placeholder domains from entering search. Use one primary domain and configure the host to redirect alternate domains to it.

## What the build provides

- Complete HTML for every page and product, readable without JavaScript.
- Unique page titles/descriptions, canonical links, Open Graph and Twitter previews.
- Business, website, breadcrumb and real product structured data, using the supplied Lagos contact details and 24-hour opening hours.
- `sitemap.xml` containing five public pages and thirteen owner-supplied product listings once the domain is configured.
- `robots.txt`, clean URLs and a custom HTTP 404 on the configured hosts.
- WebP hero, About and page banners, preserving the original files.

Cart, filtered shop views and missing pages use `noindex`. All sample-only listings are hidden from the catalog and no longer prerendered. Reintroduce them only with real photos and verified product data. Quote-only products intentionally have no invented prices or ratings and are not eligible for price-based product rich results.

## After deploying

1. Open the public home, shop and product URLs directly. Confirm HTTPS, working images and a 404 status for an unknown URL.
2. Verify domain ownership in [Google Search Console](https://search.google.com/search-console). DNS verification is preferred; HTML verification is also supported by setting `googleSiteVerification` in businessConfig and rebuilding.
3. Submit `https://YOUR-DOMAIN/sitemap.xml` in Search Console. Check its URLs all use the real primary domain.
4. Use URL Inspection to test the homepage, shop and a camera product, then request indexing. Confirm the live pages do not have a `noindex` tag.
5. Validate a public page using [Google Rich Results Test](https://search.google.com/test/rich-results). Quote-only Product markup may report missing Offer/review eligibility; add only genuine business data.
6. Create or update the owner's Google Business Profile, using the same name, phone, address, website and verified service information. Add actual business photographs and request honest customer reviews.
7. Monitor indexing, search queries and Core Web Vitals in Search Console. Publish useful, original product and installation information as it becomes available.

These changes improve crawlability and relevance; Google controls indexing, ranking and timing. Deployment, Search Console verification and Business Profile setup require the owner's domain/accounts and have not been performed here.
