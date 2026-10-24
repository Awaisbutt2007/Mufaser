# Asset manifest

Machine-readable source: `src/data/asset-sources.ts` (rendered publicly at `/image-credits/`).
Intrinsic sizes of every generated file: `src/data/image-manifest.json`.

| Files | Category | Source | Creator | Licence / permission | Attribution | Dimensions | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/assets/brand/*` | Brand | Logo supplied by client (WhatsApp image) + white logo from client's platform media | Mufasar Enterprises | Client-owned trademark, used by the owner | None | 1280×1276; 845×714 | Transparent colour logo, dark-mode mark, wordmark, favicons, OG image derived by `scripts/build_assets.py` |
| `public/assets/hero/<17 sports>-{960,1600,2560,3840}.webp` | Sport hero imagery | Mufasar tenant media, `https://mufasar-enterprises.sialkotb2b.com/api/media` (`hero-4k-*.webp`) | Produced for the Mufasar site on the platform; appears computer-generated | Tenant-owned site media, reused on the same tenant's website | None | Native **4096×1738**; served up to 3840 px | Concept scenes, not real customers. Confirm generation rights with platform provider |
| `public/assets/products/<category>/<product>-{240,480,960}.webp` (92) | Product imagery | Mufasar tenant media (`cut-p-*.png`) | Produced for Mufasar on the platform; appear computer-generated | Tenant-owned site media | None | Native 1200×1200 transparent PNG | Labelled **"Concept visual"** on every use. Replace with photos of real samples when available |
| `public/assets/craft/{sublimation,embroidery,…,process-*}-{640,1200}.webp` | Decoration / factory illustration | Platform starter library `/tenants/starter/teamwear-kitroom/` | Platform provider | Platform template asset provided to tenants — **confirm reuse terms with the provider** | None stated | 1200×1200 | Captioned "illustrative"; not the Mufasar factory |
| `public/assets/craft/{fabric,trim,pack}-*` | Fabric / trim / packaging examples | Mufasar tenant media (`sw-*.webp`) | Produced for the Mufasar site on the platform | Tenant-owned site media | None | 1200×896 | Captioned as examples |
| `public/assets/hero/field-hockey-*.webp` | Field Hockey | https://unsplash.com/photos/vOI7ePr8Ttc | Lea Panaino (@lpanaino) | Unsplash License (free, commercial; not Unsplash+) — verified on photo page 2026-10-23 | Not required; credited on page | Original 6000×4000 → 3840×2560 → cropped 2.36:1 | Navy grade. Incidental stick/shoe brands; captioned "Not a Mufasar product" |
| `public/assets/hero/wrestling-*.webp` | Wrestling | https://unsplash.com/photos/TxxSLvOvfCk | Chris Chow (@chris_chow) | Unsplash License — verified 2026-10-23 | Credited on page | 6000×4000 → 3840×2560 | Navy grade; "Not a Mufasar product" |
| `public/assets/hero/kickboxing-*.webp` | Kickboxing | https://unsplash.com/photos/1u3eIevuRqw | Nemesia Production (@nemesiaproduction) | Unsplash License — verified 2026-10-23 | Credited on page | 6240×4160 → 3840×2560 | Navy grade; glove brand visible; "Not a Mufasar product" |
| `public/assets/hero/martial-arts-*.webp` | Martial Arts | https://unsplash.com/photos/FktPF6cwIWo | Nguyen Hung (@nguyenhung190402) | Unsplash License — verified 2026-10-23 | Credited on page | 5649×3766 → 3840×2560 | Navy grade |
| `public/fonts/*.woff2` | Typography | Fontsource: Barlow Condensed, Manrope | Jeremy Tribby; Mikhail Sharanda | SIL Open Font License 1.1 | Licence notice here | — | Self-hosted |

## Supplied files deliberately not used

| File | Reason |
| --- | --- |
| `images (1).jpg` | Photograph of an NFL (Minnesota Vikings) uniform with Nike and NFL marks — third-party copyright/trademarks, no licence. |
| `wmremove-transformed.mp4` | Filename indicates a watermark was removed; origin and licence unverifiable. |
| `Football_player_*.jpg`, `Model_*_football_uniform_*.jpg`, `Wolf-Themed Football Player in Uniform.png` | Generated American-football renders containing Nike swooshes and, on some, the NFL shield and NFL team logos (Falcons, Panthers). Publishing them would present third-party trademarks as Mufasar products. |
