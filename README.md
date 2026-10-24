# Mufasar Enterprises — website

Static, production-ready website for **Mufasar Enterprises**, sportswear and textile
manufacturer and exporter, Sialkot, Pakistan. Built with [Astro](https://astro.build) 7
(static output, zero client framework), self-hosted fonts and optimised WebP imagery.

- 146 pages: home, 30 collections, 105 product pages, custom manufacturing, kit designer,
  quote, contact, about, privacy, terms, image credits, 404, plus `sitemap.xml` and `robots.txt`.
- Quote, contact and kit-designer forms submit to the Sialkot B2B platform inquiry API.
- No prices, stock levels or unverified business claims are published (see *Content rules*).

## Quick start

Requirements: Node.js ≥ 22.23.4 (tested on 24.16), npm. Python 3 + Pillow only if you
regenerate images.

```bash
npm install
npm run build          # type-check + static build into dist/
npm run preview        # http://localhost:4321 — serves dist/ + a MOCK inquiry API
```

Development with hot reload (two terminals):

```bash
node scripts/serve.mjs --mock-only   # mock inquiry API on :4322
npm run dev                          # http://localhost:4321, /api proxied to the mock
```

## Tests

| Command | What it checks |
| --- | --- |
| `npm run test:unit` | Form validation, platform payload shape, error mapping, "never claim success without a reference" (10 tests) |
| `npm run test:e2e` | Playwright on installed Google Chrome at 1440 px and 375 px: first-viewport proposition and CTAs, all 30 categories linked, every sitemap URL returns 200 with one `<h1>`, mega menu and mobile drawer, search/filter and empty states, quote success/validation/failure, kit designer payload, no horizontal scroll, axe WCAG 2.1 AA (serious/critical) on 11 key pages |
| `npm run audit:links` | Every local `href`/`src`/`srcset` in `dist/` resolves; every page has title, meta description, canonical and exactly one `<h1>`; no page shows a price |

Run `npm run build` before `test:e2e` / `audit:links` (they test `dist/`).
`MOCK_INQUIRY_MODE=fail` or `=ratelimit` makes the mock API simulate platform failures.

## Architecture

```
src/
  data/
    company.ts             single source of truth for every business claim (with `confirmed` flags)
    catalog.ts             collections, groups, products, image helpers
    platform-catalog.json  read-only export of the owner's platform catalog (92 products)
    asset-sources.ts       image licence manifest (rendered at /image-credits/)
    image-manifest.json    generated: intrinsic sizes of every optimised image
  lib/inquiry.ts           validation + platform payload + submit (shared, unit-tested)
  scripts/forms.ts         progressive enhancement for every [data-inquiry-form]
  components/              Header (mega menu, drawer), Footer, ProductCard, QuoteForm, …
  layouts/Base.astro       SEO/OG/canonical/JSON-LD, font preloads, reveal-on-scroll
  pages/                   routes (collections/[slug]/[product] are generated from data)
scripts/
  build_assets.py          builds public/assets/** (responsive WebP, logo derivations, OG image)
  fetch_sources.py         re-downloads original image sources into assets-src/
  serve.mjs                preview server + mock inquiry API
  check-links.mjs          static link / metadata / price audit
```

To add or edit products, edit `src/data/platform-catalog.json` (platform products) or the
`pending(...)` lists in `src/data/catalog.ts`; pages, sitemap, search and menus update
automatically. Product images go in `public/assets/products/<category>/<slug>-{240,480,960}.webp`.

## Quote and inquiry handling

Forms `POST` JSON to **`/api/inquiries`** with an `idempotency-key` header — the same
contract the platform's own template uses. The platform does the authoritative
server-side validation, honeypot spam filtering, rate limiting and storage, and delivers
inquiries to the owner's inbox (readable via the platform's inquiry tools). The browser
also validates (same limits) and only shows *Request received* when the platform returns
an inquiry reference.

The endpoint sends **no CORS headers**, so forms work only when the site is served from
the tenant hostname (`mufasar-enterprises.sialkotb2b.com` or a domain connected to that
tenant). On any other host, set `PUBLIC_INQUIRY_ENDPOINT` to a backend you control.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SITE_URL` | `https://mufasar-enterprises.sialkotb2b.com` | Canonical URLs, sitemap, Open Graph. Set when a custom domain is connected. |
| `PUBLIC_INQUIRY_ENDPOINT` | `/api/inquiries` | Override the inquiry endpoint. Public by design — never put a secret here. |

No secrets are required or stored by this project.

## Deployment

The site is a folder of static files (`dist/`). Recommended path, which keeps the working
inquiry backend:

1. `SITE_URL=https://<final-domain> npm run build && npm run audit:links && npm run test:e2e`
2. Upload `dist/` to the **Mufasar tenant on the Sialkot B2B platform** as a static bundle
   (platform tools `platform_static_site_create` → `upload_file` → `seal`). Sealing returns a
   **preview URL on the tenant hostname** — nothing is live yet.
3. Test the preview, including one real quote submission, then have the owner approve
   activation (`platform_static_site_activate`). Roll back with `platform_static_site_deactivate`.
4. In the platform's site configuration, turn **search indexing on** when ready (it is
   currently off on the draft tenant).

Recommended response headers (if the host allows): `Cache-Control: public, max-age=31536000, immutable`
for `/_astro/*`, `/fonts/*`, `/assets/*`; `no-cache` for HTML; `X-Content-Type-Options: nosniff`;
`Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

## Content rules (owner action needed)

`src/data/company.ts` holds every factual claim. Items marked `confirmed: false` are **not**
published until the owner confirms them:

- **Minimum order quantity** — existing platform content says both "10 per style" and
  "50 pieces per style and colour". Pages currently say "confirmed with your quote".
- **Sialkot Chamber of Commerce & Industry membership** — stated in old copy; not verified.

Also still needed from the owner: real product/factory photographs, certifications (if any),
testimonials (only genuine, with permission), the letterhead (not supplied), a custom domain,
and confirmation of the platform-provided lead times, payment terms and markets shown on the site.
