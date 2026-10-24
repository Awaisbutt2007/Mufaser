#!/usr/bin/env node
/**
 * Static link/asset audit of dist/: every local href, src and srcset must resolve
 * to a built file, every page needs a title, description, single h1 and canonical,
 * and no page may show a price.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

const root = resolve('dist');
const problems = [];
let pages = 0;
let refs = 0;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function exists(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (!clean) return true;
  const target = join(root, clean);
  try {
    const s = await stat(target);
    if (s.isDirectory()) { await stat(join(target, 'index.html')); }
    return true;
  } catch {
    return false;
  }
}

const files = (await walk(root)).filter((f) => f.endsWith('.html'));
for (const file of files) {
  pages++;
  const html = await readFile(file, 'utf8');
  const page = '/' + relative(root, file).split(sep).join('/');
  const urls = new Set();
  for (const m of html.matchAll(/\s(?:href|src|data-src)="([^"]+)"/g)) urls.add(m[1]);
  for (const m of html.matchAll(/\s(?:srcset|data-srcset|imagesrcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) urls.add(part.trim().split(/\s+/)[0]);
  }
  for (const u of urls) {
    if (!u || /^(https?:|mailto:|tel:|#|data:|javascript:)/.test(u)) continue;
    refs++;
    if (!u.startsWith('/')) { problems.push(`${page}: relative URL ${u}`); continue; }
    if (!(await exists(u))) problems.push(`${page}: missing ${u}`);
  }
  if (page.endsWith('404.html')) continue;
  if (!/<title>[^<]{10,}<\/title>/.test(html)) problems.push(`${page}: missing/short <title>`);
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) problems.push(`${page}: missing/short meta description`);
  if (!/<link rel="canonical"/.test(html)) problems.push(`${page}: missing canonical`);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) problems.push(`${page}: ${h1} <h1> elements`);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const price = text.match(/(?:[$€£]|USD|EUR|GBP|PKR|Rs\.?)\s?\d/);
  if (price) problems.push(`${page}: looks like a price: "${price[0]}"`);
  if (/lorem ipsum|TODO|placeholder text/i.test(text)) problems.push(`${page}: placeholder text`);
}

console.log(`Checked ${pages} pages, ${refs} local references.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n` + problems.slice(0, 200).join('\n'));
  process.exit(1);
}
console.log('No broken links, missing assets, missing metadata or prices found.');
