import type { APIRoute } from 'astro';
import { allProducts, categories, categoryUrl, productUrl } from '../data/catalog';

const staticPaths = [
  '/', '/collections/', '/custom-manufacturing/', '/design-your-kit/', '/request-a-quote/',
  '/about/', '/contact/', '/privacy/', '/terms/', '/image-credits/',
];

export const GET: APIRoute = ({ site }) => {
  const base = site!;
  const urls = [
    ...staticPaths,
    ...categories.map((c) => categoryUrl(c)),
    ...allProducts.map((p) => productUrl(p)),
  ].map((path) => `  <url><loc>${new URL(path, base).href}</loc></url>`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
