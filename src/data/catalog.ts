/**
 * Catalog model.
 *
 * Products and sport categories come from the owner's platform catalog
 * (platform-catalog.json, exported read-only). This file adds navigation groups,
 * imagery, the categories the platform did not yet have (field hockey, wrestling,
 * kickboxing, martial arts hub) and the performance/lifestyle collection views.
 *
 * Nothing here states a price, stock level or order minimum.
 */
import platform from './platform-catalog.json';
import manifest from './image-manifest.json';

export type GroupId = 'team' | 'combat' | 'performance';
export type Garment =
  | 'jersey' | 'shorts' | 'trousers' | 'socks' | 'jacket' | 'hoodie' | 'tee'
  | 'singlet' | 'skirt' | 'cap' | 'gi' | 'belt' | 'bra' | 'leggings' | 'set';

export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  group: string;
  description: string;
  features: string[];
  specs: [string, string][];
  /** Base path without width suffix, e.g. /assets/products/soccer/soccer-match-jersey */
  image: string | null;
  garment: Garment;
}

export interface Category {
  slug: string;
  name: string;
  group: GroupId;
  /** sport = owns products; view = filtered collection; hub = links other collections */
  kind: 'sport' | 'view' | 'hub';
  summary: string;
  intro: string;
  hero: string | null;
  heroPosition: string;
  heroCredit?: { author: string; profile: string; photo: string };
  options: string[];
  faqs: { q: string; a: string }[];
  subcategories: string[];
  products: Product[];
  /** For views/hubs: related collection slugs shown as links. */
  related?: string[];
  keywords: string[];
}

export const groups: { id: GroupId; name: string; short: string; description: string }[] = [
  {
    id: 'team',
    name: 'Team Sportswear',
    short: 'Team sports',
    description: 'Match kits, training wear and warm-ups for clubs, schools, leagues and team stores.',
  },
  {
    id: 'combat',
    name: 'Combat Sportswear',
    short: 'Combat sports',
    description: 'Fight wear, gis, doboks and club apparel for gyms, academies and fight brands.',
  },
  {
    id: 'performance',
    name: 'Performance & Lifestyle',
    short: 'Performance & lifestyle',
    description: 'Gym, fitness, running, yoga and streetwear made under your own label.',
  },
];

const IMG = (cat: string, slug: string) => `/assets/products/${cat}/${slug}`;

/** Pick a line-drawing placeholder for products that do not have imagery yet. */
function garmentOf(name: string): Garment {
  const n = name.toLowerCase();
  if (/belt/.test(n)) return 'belt';
  if (/\bgi\b|judogi|dobok|smock/.test(n)) return 'gi';
  if (/singlet|vest|tank/.test(n)) return 'singlet';
  if (/bra/.test(n)) return 'bra';
  if (/legging|tights|spats/.test(n)) return 'leggings';
  if (/skirt|skort|dress/.test(n)) return 'skirt';
  if (/short/.test(n)) return 'shorts';
  if (/sock/.test(n)) return 'socks';
  if (/trouser|pants|jogger/.test(n)) return 'trousers';
  if (/cap|beanie/.test(n)) return 'cap';
  if (/hoodie/.test(n)) return 'hoodie';
  if (/jacket|zip|tracksuit|robe|sweater|top/.test(n)) return 'jacket';
  if (/set/.test(n)) return 'set';
  if (/tee|polo|shirt|guard/.test(n)) return 'tee';
  return 'jersey';
}

const DEFAULT_SPECS: [string, string][] = [
  ['Decoration', 'Sublimation, embroidery, print or transfers where suited'],
  ['Sizes', 'Youth and adult'],
  ['Colours', 'Made in your colours'],
  ['Minimum order', 'Confirmed with your quote'],
];

function describe(name: string): string {
  return `${name} made to order in your colours, with your crest, logo or private label. Construction, fabric and decoration are agreed with you and confirmed on a physical sample before bulk production.`;
}

type PlatformProduct = {
  slug: string; name: string; group: string; features: string[]; specs: string[][]; source: string | null;
};
type PlatformCategory = {
  slug: string; name: string; intro: string; options: string[];
  faqs: { q: string; a: string }[]; seo: string[]; subcategories: string[]; products: PlatformProduct[];
};

function fromPlatform(c: PlatformCategory, displayName = c.name): Product[] {
  return c.products.map((p) => ({
    slug: p.slug,
    name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
    categorySlug: c.slug,
    categoryName: displayName,
    group: p.group,
    description: describe(p.name.charAt(0).toUpperCase() + p.name.slice(1)),
    features: p.features.filter((f) => f !== 'Your branding' && f !== 'Made to order'),
    specs: p.specs.map(([k, v]) =>
      k === 'Colours' ? ['Colours', 'Made in your colours'] : k === 'Minimum' ? ['Minimum order', v] : [k, v],
    ) as [string, string][],
    image: p.source ? IMG(c.slug, p.slug) : null,
    garment: garmentOf(p.name),
  }));
}

/** Product types for categories that do not have platform imagery yet. */
function pending(categorySlug: string, categoryName: string, items: [string, string][]): Product[] {
  return items.map(([name, group]) => ({
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    name,
    categorySlug,
    categoryName,
    group,
    description: describe(name),
    features: [group],
    specs: DEFAULT_SPECS,
    image: null,
    garment: garmentOf(name),
  }));
}

const P = Object.fromEntries((platform.categories as PlatformCategory[]).map((c) => [c.slug, c]));

const heroPos: Record<string, string> = {
  soccer: '62% 50%', cricket: '60% 50%', basketball: '64% 50%', volleyball: '72% 50%',
  rugby: '70% 50%', 'american-football': '72% 45%', baseball: '78% 45%', 'ice-hockey': '76% 50%',
  tennis: '70% 50%', 'field-hockey': '40% 50%', boxing: '82% 50%', mma: '72% 50%', bjj: '68% 55%',
  karate: '70% 50%', taekwondo: '80% 50%', judo: '72% 55%', wrestling: '58% 50%', kickboxing: '58% 45%',
  'martial-arts': '45% 50%', activewear: '58% 45%', streetwear: '78% 50%',
};

const summaries: Record<string, string> = {
  soccer: 'Jerseys, shorts, socks, goalkeeper kits and training wear.',
  cricket: 'Coloured playing kit, whites, sweaters and caps.',
  basketball: 'Game jerseys, shorts, reversibles and warm-ups.',
  volleyball: 'Jerseys, spandex shorts, libero kits and warm-ups.',
  rugby: 'Match jerseys, shorts, socks and training wear.',
  'american-football': 'Game and practice jerseys, pants and team hoodies.',
  baseball: 'Button and pullover jerseys, pants, caps and jackets.',
  'ice-hockey': 'Game and practice jerseys, socks and team jackets.',
  tennis: 'Polos, shorts, skirts, dresses and quarter-zips.',
  'field-hockey': 'Playing shirts, shorts, skorts, socks and goalkeeper smocks.',
  boxing: 'Ring shorts, vests, robes and training wear.',
  mma: 'Fight shorts, rash guards, spats and walkout wear.',
  bjj: 'Gis, rash guards, no-gi shorts and belts.',
  karate: 'Lightweight and heavyweight gis, belts and club tees.',
  taekwondo: 'Doboks, belts and club tracksuits.',
  judo: 'White and blue judogis, belts and club hoodies.',
  wrestling: 'Singlets, fight shorts, compression tops and warm-ups.',
  kickboxing: 'Kickboxing and Muay Thai shorts, tanks and rash guards.',
  'martial-arts': 'Gis, doboks, belts and club wear across every discipline.',
};

function sport(
  slug: string,
  group: GroupId,
  opts: Partial<Category> & { name?: string } = {},
): Category {
  const src = P[slug];
  const name = opts.name ?? src?.name ?? slug;
  return {
    slug,
    name,
    group,
    kind: 'sport',
    summary: summaries[slug] ?? '',
    intro: src?.intro ?? '',
    hero: slug,
    heroPosition: heroPos[slug] ?? '50% 50%',
    options: src?.options ?? ['Your colours and crest', 'Names, numbers or private label', 'Youth and adult sizes'],
    faqs: src?.faqs ?? [
      { q: 'What is the minimum order?', a: 'It depends on the product and decoration, and is confirmed with your quote.' },
      { q: 'Can every piece carry our branding?', a: 'Yes. Crest, sponsor logos, names and numbers or your own label, placed where you want them.' },
    ],
    subcategories: src?.subcategories ?? [],
    products: src ? fromPlatform(src, name) : [],
    keywords: src?.seo ?? [],
    ...opts,
  };
}

const unsplash = (author: string, profile: string, photo: string) => ({ author, profile, photo });

const teamSports: Category[] = [
  sport('soccer', 'team', { name: 'Soccer / Football' }),
  sport('cricket', 'team'),
  sport('basketball', 'team'),
  sport('volleyball', 'team'),
  sport('rugby', 'team'),
  sport('american-football', 'team'),
  sport('baseball', 'team'),
  sport('ice-hockey', 'team'),
  sport('tennis', 'team'),
  sport('field-hockey', 'team', {
    name: 'Field Hockey',
    intro: 'Playing shirts, shorts, skorts and socks for clubs, schools and academies, plus goalkeeper smocks, made to order in your colours.',
    heroCredit: unsplash('Lea Panaino', 'https://unsplash.com/@lpanaino', 'https://unsplash.com/photos/vOI7ePr8Ttc'),
    subcategories: ['Match kit', 'Goalkeeper'],
    products: pending('field-hockey', 'Field Hockey', [
      ['Field hockey playing shirt', 'Match kit'],
      ['Field hockey shorts', 'Match kit'],
      ['Field hockey skort', 'Match kit'],
      ['Field hockey socks', 'Match kit'],
      ['Goalkeeper smock', 'Goalkeeper'],
    ]),
    keywords: ['custom field hockey kits', 'field hockey uniforms manufacturer'],
  }),
];

const combatSports: Category[] = [
  sport('boxing', 'combat'),
  sport('mma', 'combat', { name: 'MMA' }),
  sport('bjj', 'combat', { name: 'Brazilian Jiu-Jitsu (BJJ)' }),
  sport('karate', 'combat'),
  sport('taekwondo', 'combat'),
  sport('judo', 'combat'),
  sport('wrestling', 'combat', {
    name: 'Wrestling',
    intro: 'Sublimated singlets, fight shorts and compression tops for clubs, schools and wrestling programmes, with matching team warm-ups.',
    heroCredit: unsplash('Chris Chow', 'https://unsplash.com/@chris_chow', 'https://unsplash.com/photos/TxxSLvOvfCk'),
    subcategories: ['Competition', 'Training'],
    products: pending('wrestling', 'Wrestling', [
      ['Wrestling singlet', 'Competition'],
      ['Wrestling fight shorts', 'Competition'],
      ['Wrestling compression top', 'Training'],
      ['Team warm-up hoodie', 'Training'],
    ]),
    keywords: ['custom wrestling singlets', 'wrestling apparel manufacturer'],
  }),
  sport('kickboxing', 'combat', {
    name: 'Kickboxing',
    intro: 'Kickboxing and Muay Thai shorts, training tanks and rash guards for gyms, fight teams and combat-sports brands.',
    heroCredit: unsplash('Nemesia Production', 'https://unsplash.com/@nemesiaproduction', 'https://unsplash.com/photos/1u3eIevuRqw'),
    subcategories: ['Fight wear', 'Training'],
    products: pending('kickboxing', 'Kickboxing', [
      ['Kickboxing shorts', 'Fight wear'],
      ['Muay Thai shorts', 'Fight wear'],
      ['Training tank', 'Training'],
      ['Kickboxing rash guard', 'Training'],
    ]),
    keywords: ['custom kickboxing shorts', 'muay thai shorts manufacturer'],
  }),
  {
    ...sport('martial-arts', 'combat', {
      name: 'Martial Arts',
      intro: 'Uniforms, belts and club wear for martial-arts schools and associations. Browse each discipline below, or send us the uniform specification your style requires.',
      heroCredit: unsplash('Nguyen Hung', 'https://unsplash.com/@nguyenhung190402', 'https://unsplash.com/photos/FktPF6cwIWo'),
      keywords: ['martial arts uniforms manufacturer', 'custom gis and doboks'],
    }),
    kind: 'hub',
    related: ['karate', 'taekwondo', 'judo', 'bjj', 'kickboxing', 'wrestling', 'mma', 'boxing'],
    subcategories: [],
    products: [],
  },
];

// Performance & lifestyle: platform activewear/streetwear plus filtered views.
const activewear = sport('activewear', 'performance', {
  name: 'Activewear',
  intro: P.activewear?.intro ?? '',
  summary: 'The full performance range: gym, fitness, compression, yoga, running and training wear.',
});
const streetwear = sport('streetwear', 'performance', {
  name: 'Streetwear',
  summary: 'Heavyweight hoodies, tees, joggers, jackets and caps under your own label.',
});

function view(slug: string, name: string, summary: string, intro: string, match: ((p: Product) => boolean) | string[]): Category {
  const products = Array.isArray(match)
    ? match.map((m) => activewear.products.find((p) => p.slug === m)).filter((p): p is Product => Boolean(p))
    : activewear.products.filter(match);
  return {
    slug,
    name,
    group: 'performance',
    kind: 'view',
    summary,
    intro,
    hero: null,
    heroPosition: '50% 50%',
    options: ['Your fabric, colours and fit', 'Your logo or private label', 'Youth and adult sizes'],
    faqs: activewear.faqs,
    subcategories: [],
    products,
    related: ['activewear', 'streetwear'],
    keywords: [`custom ${name.toLowerCase()} manufacturer`, `private label ${name.toLowerCase()}`],
  };
}

const g = (...names: string[]) => (p: Product) => names.includes(p.group);
const s = (...slugs: string[]) => slugs;

const performance: Category[] = [
  view('gym-wear', 'Gym Wear', 'Training tees, tanks and gym essentials.',
    'Gym tees, tanks and training layers made under your label, in your fabric and colours.', g('Gym wear')),
  activewear,
  view('fitness-wear', 'Fitness Wear', 'Crop tops and studio-ready fitness pieces.',
    'Fitness and studio wear for gyms, instructors and activewear brands.', g('Fitness wear')),
  view('compression-wear', 'Compression Wear', 'Compression long sleeves and tights.',
    'Compression tops and tights for training and recovery, made to your specification.', g('Compression wear')),
  view('yoga-wear', 'Yoga Wear', 'Matching yoga sets.',
    'Yoga sets for studios and activewear labels, made in your fabric and colours.', g('Yoga wear')),
  view('running-wear', 'Running Wear', 'Running shorts and singlets.',
    'Running shorts and singlets for clubs, events and running brands.', g('Running wear')),
  view('workout-shorts', 'Workout Shorts', 'Training shorts for gym and conditioning.',
    'Workout and training shorts made under your label.', s('workout-shorts', 'running-shorts')),
  view('leggings', 'Leggings', 'High-waist leggings and tights.',
    'Leggings and tights for activewear brands and gyms, in your fabric and colours.', s('high-waist-leggings', 'compression-tights')),
  view('sports-bras', 'Sports Bras', 'Sports bras and crop tops.',
    'Sports bras and supportive crop tops for activewear labels.', s('sports-bra', 'fitness-crop-top')),
  view('tracksuits', 'Tracksuits', 'Tracksuit sets for teams and brands.',
    'Tracksuits for teams, clubs and lifestyle brands, made to order in your colours.', g('Tracksuits')),
  streetwear,
];
// Tracksuits view also surfaces team tracksuits from other collections.
const tracksuits = performance.find((c) => c.slug === 'tracksuits')!;

export const categories: Category[] = [...teamSports, ...combatSports, ...performance];

for (const c of categories) {
  if (c.slug === 'tracksuits') continue;
  for (const p of c.products) {
    if (c.kind === 'sport' && /tracksuit/.test(p.slug) && c.slug !== 'activewear') tracksuits.products.push(p);
  }
}

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

/** Every product exactly once, keyed by its owning (sport) category. */
export const allProducts: Product[] = categories
  .filter((c) => c.kind === 'sport')
  .flatMap((c) => c.products);

export const productUrl = (p: Product) => `/collections/${p.categorySlug}/${p.slug}/`;
export const categoryUrl = (c: Category | string) => `/collections/${typeof c === 'string' ? c : c.slug}/`;

export function categoriesIn(group: GroupId) {
  return categories.filter((c) => c.group === group);
}

/** Representative product image for a category card. */
export function coverProduct(c: Category): Product | undefined {
  const pool = c.kind === 'hub' ? (c.related ?? []).flatMap((r) => categoryBySlug[r]?.products ?? []) : c.products;
  return pool.find((p) => p.image);
}

// ---------------------------------------------------------------- images
type ManifestEntry = { w: number; h: number };
const M = manifest as Record<string, ManifestEntry>;

export function heroSources(slug: string) {
  const widths = [960, 1600, 2560, 3840].filter((w) => M[`hero/${slug}-${w}.webp`]);
  return {
    src: `/assets/hero/${slug}-${widths.includes(1600) ? 1600 : widths[0]}.webp`,
    srcset: widths.map((w) => `/assets/hero/${slug}-${w}.webp ${w}w`).join(', '),
    width: 4096,
    height: 1738,
  };
}

export function productSources(base: string) {
  return {
    src: `${base}-480.webp`,
    srcset: `${base}-240.webp 240w, ${base}-480.webp 480w, ${base}-960.webp 960w`,
    large: `${base}-960.webp`,
    width: 960,
    height: 960,
  };
}

export function craftSources(slug: string) {
  return {
    src: `/assets/craft/${slug}-640.webp`,
    srcset: `/assets/craft/${slug}-640.webp 640w, /assets/craft/${slug}-1200.webp 1200w`,
    width: M[`craft/${slug}-1200.webp`]?.w ?? 1200,
    height: M[`craft/${slug}-1200.webp`]?.h ?? 1200,
  };
}

export const featuredProductRefs: [string, string][] = [
  ['soccer', 'soccer-match-jersey'],
  ['basketball', 'basketball-game-jersey'],
  ['american-football', 'football-game-jersey'],
  ['cricket', 'cricket-playing-shirt'],
  ['boxing', 'boxing-shorts'],
  ['bjj', 'bjj-gi'],
  ['activewear', 'compression-long-sleeve'],
  ['streetwear', 'heavyweight-hoodie'],
];

export const featuredProducts = featuredProductRefs
  .map(([c, s]) => categoryBySlug[c]?.products.find((p) => p.slug === s))
  .filter((p): p is Product => Boolean(p));
