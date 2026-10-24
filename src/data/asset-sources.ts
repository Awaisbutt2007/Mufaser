/**
 * Asset manifest: where every image on the site comes from and on what terms.
 * Rendered at /image-credits/ and summarised in ASSET-MANIFEST.md.
 */
export interface AssetSource {
  files: string;
  category: string;
  provider: string;
  source: string;
  creator: string;
  license: string;
  attribution: string;
  dimensions: string;
  notes: string;
}

const PLATFORM = 'https://mufasar-enterprises.sialkotb2b.com';

export const assetSources: AssetSource[] = [
  {
    files: 'public/assets/brand/*',
    category: 'Brand',
    provider: 'Mufasar Enterprises',
    source: 'Logo supplied by the client (WhatsApp image, 1280×1276) and the white logo from the client\'s platform media library',
    creator: 'Mufasar Enterprises',
    license: 'Client-owned trademark, used with permission of the owner',
    attribution: 'None required',
    dimensions: 'Colour source 1280×1276; white logo 845×714',
    notes: 'Transparent colour logo, shield mark, dark-mode mark, favicons and OG image derived by scripts/build_assets.py.',
  },
  {
    files: 'public/assets/hero/{17 sports}-{960,1600,2560,3840}.webp',
    category: 'Sport hero imagery',
    provider: 'Mufasar Enterprises tenant media library (Sialkot B2B platform)',
    source: `${PLATFORM}/api/media (keys sites/site_mufasar_enterprises/media/*/hero-4k-*.webp)`,
    creator: 'Produced for the Mufasar Enterprises site on the platform; appears to be computer-generated concept imagery',
    license: 'Tenant-owned site media; reused on the same tenant\'s website',
    attribution: 'None required',
    dimensions: 'Native 4096×1738; delivered at up to 3840 px wide',
    notes: 'Cinematic concept scenes, not photographs of real Mufasar customers. Owner should confirm generation rights with the platform provider.',
  },
  {
    files: 'public/assets/products/{category}/{product}-{480,960}.webp (92 products)',
    category: 'Product imagery',
    provider: 'Mufasar Enterprises tenant media library (Sialkot B2B platform)',
    source: `${PLATFORM}/api/media (keys .../cut-p-*.png)`,
    creator: 'Produced for Mufasar Enterprises on the platform; appear to be computer-generated garment visuals with the Mufasar mark',
    license: 'Tenant-owned site media; reused on the same tenant\'s website',
    attribution: 'None required',
    dimensions: 'Native 1200×1200 transparent PNG; delivered as 480 and 960 px WebP',
    notes: 'Labelled "Concept visual" on the site. Replace with photographs of real samples when available.',
  },
  {
    files: 'public/assets/craft/{decoration,process}-*.webp',
    category: 'Decoration and factory illustration',
    provider: 'Sialkot B2B platform starter library (/tenants/starter/teamwear-kitroom/)',
    source: `${PLATFORM}/tenants/starter/teamwear-kitroom/`,
    creator: 'Platform provider',
    license: 'Platform template asset provided to tenants; confirm reuse terms with the platform provider',
    attribution: 'None stated',
    dimensions: 'Native 1200×1200; delivered at 640 and 1200 px',
    notes: 'Captioned as illustrative. Not a photograph of the Mufasar factory.',
  },
  {
    files: 'public/assets/craft/{fabric,trim,pack}-*.webp',
    category: 'Fabric, trim and packaging examples',
    provider: 'Mufasar Enterprises tenant media library (Sialkot B2B platform)',
    source: `${PLATFORM}/api/media (keys .../sw-*.webp)`,
    creator: 'Produced for the Mufasar Enterprises site on the platform',
    license: 'Tenant-owned site media',
    attribution: 'None required',
    dimensions: 'Native 1200×896',
    notes: 'Captioned as examples.',
  },
  {
    files: 'public/assets/hero/field-hockey-*.webp',
    category: 'Field Hockey',
    provider: 'Unsplash',
    source: 'https://unsplash.com/photos/vOI7ePr8Ttc',
    creator: 'Lea Panaino (@lpanaino)',
    license: 'Unsplash License (free commercial use; not Unsplash+)',
    attribution: 'Not required; credited on page',
    dimensions: 'Original 6000×4000; downloaded at 3840×2560; cropped to 2.36:1',
    notes: 'Navy grade applied. Incidental third-party marks on sticks and shoes; captioned "Not a Mufasar product".',
  },
  {
    files: 'public/assets/hero/wrestling-*.webp',
    category: 'Wrestling',
    provider: 'Unsplash',
    source: 'https://unsplash.com/photos/TxxSLvOvfCk',
    creator: 'Chris Chow (@chris_chow)',
    license: 'Unsplash License (free commercial use; not Unsplash+)',
    attribution: 'Not required; credited on page',
    dimensions: 'Original 6000×4000; downloaded at 3840×2560; cropped to 2.36:1',
    notes: 'Navy grade applied. Captioned "Not a Mufasar product".',
  },
  {
    files: 'public/assets/hero/kickboxing-*.webp',
    category: 'Kickboxing',
    provider: 'Unsplash',
    source: 'https://unsplash.com/photos/1u3eIevuRqw',
    creator: 'Nemesia Production (@nemesiaproduction)',
    license: 'Unsplash License (free commercial use; not Unsplash+)',
    attribution: 'Not required; credited on page',
    dimensions: 'Original 6240×4160; downloaded at 3840×2560; cropped to 2.36:1',
    notes: 'Navy grade applied. Glove brand visible; captioned "Not a Mufasar product".',
  },
  {
    files: 'public/assets/hero/martial-arts-*.webp',
    category: 'Martial Arts',
    provider: 'Unsplash',
    source: 'https://unsplash.com/photos/FktPF6cwIWo',
    creator: 'Nguyen Hung (@nguyenhung190402)',
    license: 'Unsplash License (free commercial use; not Unsplash+)',
    attribution: 'Not required; credited on page',
    dimensions: 'Original 5649×3766; downloaded at 3840×2560; cropped to 2.36:1',
    notes: 'Navy grade applied.',
  },
  {
    files: 'public/fonts/*.woff2',
    category: 'Typography',
    provider: 'Fontsource (npm)',
    source: 'Barlow Condensed (Jeremy Tribby) and Manrope (Mikhail Sharanda)',
    creator: 'See font metadata',
    license: 'SIL Open Font License 1.1',
    attribution: 'Licence notice retained in this manifest',
    dimensions: '—',
    notes: 'Self-hosted; no third-party font requests.',
  },
];

/** Supplied files deliberately NOT used, and why. */
export const rejectedAssets = [
  { file: 'images (1).jpg', reason: 'Photograph of an NFL (Minnesota Vikings) uniform with Nike and NFL marks. Third-party copyright and trademarks; no licence.' },
  { file: 'wmremove-transformed.mp4', reason: 'Filename indicates a watermark was removed. Origin and licence cannot be verified, so it was not used.' },
  { file: 'Football_player_*.jpg, Model_*_football_uniform_*.jpg, Wolf-Themed Football Player in Uniform.png', reason: 'Generated American-football renders that contain Nike swooshes and, on some, NFL shields and NFL team logos (Falcons, Panthers). Using them would misrepresent third-party trademarks as Mufasar products.' },
];
