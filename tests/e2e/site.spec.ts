import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1000;

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(1);
}

test.describe('home page: first impression', () => {
  test('communicates the offer and actions in the first viewport', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText(/custom sportswear manufacturing/i);
    await expect(h1).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Explore Collections' }).first()).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Design Your Kit' }).first()).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Mufasar Enterprises — home' })).toBeVisible();

    // Product imagery is visible immediately (no intro animation gate).
    const garment = page.locator('[data-hero-garment]').first().locator('img');
    await expect(garment).toBeVisible();
    expect(await garment.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);

    await noHorizontalScroll(page);
    expect(errors).toEqual([]);
  });

  test('every image on the home page loads', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    });
    await page.waitForLoadState('networkidle');
    const broken = await page.evaluate(() =>
      [...document.images].filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
    expect(broken).toEqual([]);
  });

  test('scrolling the pinned hero advances through the sports', async ({ page }) => {
    test.skip(isMobile(page), 'desktop wheel test');
    await page.goto('/');
    await page.waitForTimeout(1200);
    await expect(page.locator('[data-hero-now]')).toHaveText('01');
    await page.mouse.wheel(0, 300);
    await expect(page.locator('[data-hero-now]')).toHaveText('02', { timeout: 4000 });
    await expect(page.getByRole('button', { name: 'Basketball', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.hero')).toHaveClass(/is-scroll/);
  });

  test('sport buttons scroll to that sport', async ({ page }) => {
    test.skip(isMobile(page), 'desktop only');
    await page.goto('/');
    await page.waitForTimeout(1200);
    await page.locator('[data-hero-tab]', { hasText: 'Cricket' }).click();
    await expect(page.locator('[data-hero-now]')).toHaveText('04', { timeout: 6000 });
  });

  test('reduced motion: no pinning, buttons switch sports', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.hero')).toHaveClass(/is-static/);
    expect(await page.locator('.pin-spacer').count()).toBe(0);
    await page.locator('[data-hero-tab]', { hasText: 'Basketball' }).click();
    await expect(page.locator('[data-hero-now]')).toHaveText('02');
    await expect(page.locator('[data-hero-garment]').nth(1)).toHaveAttribute('data-active', 'true');
  });
});

test.describe('navigation', () => {
  test('desktop mega menu opens, closes with Escape and returns focus', async ({ page }) => {
    test.skip(isMobile(page), 'desktop only');
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'Collections' });
    await btn.click();
    await expect(page.locator('#mega-collections')).toBeVisible();
    await expect(page.locator('#mega-collections').getByRole('link', { name: 'American Football' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mega-collections')).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('mobile drawer reaches a combat collection', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const box = await page.locator('#mobile-drawer').boundingBox();
    expect(box!.height, 'drawer covers the viewport below the header').toBeGreaterThan(600);
    await page.locator('#mobile-drawer summary', { hasText: 'Combat sports' }).click();
    await page.locator('#mobile-drawer').getByRole('link', { name: 'Kickboxing' }).click();
    await expect(page).toHaveURL(/\/collections\/kickboxing\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kickboxing');
  });

  test('every sitemap URL responds 200 with one h1', async ({ page, request }) => {
    test.skip(isMobile(page), 'run once');
    test.setTimeout(180_000);
    const xml = await (await request.get('/sitemap.xml')).text();
    const paths = [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(120);
    for (const p of paths) {
      const res = await request.get(p);
      expect(res.status(), p).toBe(200);
      const html = await res.text();
      expect((html.match(/<h1[\s>]/g) ?? []).length, `${p} h1 count`).toBe(1);
    }
  });

  test('all thirty required categories are linked from the collections page', async ({ page }) => {
    await page.goto('/collections/');
    const required = [
      'Soccer / Football', 'Cricket', 'Basketball', 'Volleyball', 'Rugby', 'American Football', 'Baseball', 'Ice Hockey', 'Tennis', 'Field Hockey',
      'Boxing', 'MMA', 'Brazilian Jiu-Jitsu (BJJ)', 'Karate', 'Taekwondo', 'Judo', 'Wrestling', 'Kickboxing', 'Martial Arts',
      'Gym Wear', 'Activewear', 'Fitness Wear', 'Compression Wear', 'Yoga Wear', 'Running Wear', 'Workout Shorts', 'Leggings', 'Sports Bras', 'Tracksuits', 'Streetwear',
    ];
    for (const name of required) {
      await expect(page.locator('.collection-link strong', { hasText: new RegExp(`^${name.replace(/[()/]/g, '\\$&')}$`) })).toHaveCount(1);
    }
  });
});

test.describe('catalog', () => {
  test('product finder filters and shows an empty state', async ({ page }) => {
    await page.goto('/collections/');
    const search = page.getByRole('searchbox', { name: 'Search products' });
    await search.fill('gi');
    await expect(page.locator('[data-count]')).not.toHaveText(/^1\d\d products/);
    await expect(page.locator('[data-results] [data-product-card]:visible').first()).toBeVisible();
    await search.fill('zzzz');
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(page.locator('[data-count]')).toHaveText('0 products');
  });

  test('collection page filters by style group', async ({ page }) => {
    await page.goto('/collections/soccer/');
    await page.getByRole('button', { name: 'Goalkeeper' }).click();
    await expect(page.locator('[data-count]')).toHaveText('1 style');
  });

  test('product page shows specification, honest imagery labels and no price', async ({ page }) => {
    await page.goto('/collections/rugby/rugby-match-jersey/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rugby match jersey');
    await expect(page.locator('.spec-table')).toContainText('Quoted to your specification and quantity');
    await expect(page.locator('.gallery figcaption').first()).toContainText(/concept visual/i);
    await expect(page.locator('body')).not.toContainText(/[$€£]\s?\d/);
    await page.getByRole('button', { name: /Show image 3 of 3/ }).click();
    await expect(page.locator('[data-shot="detail"] img')).toBeVisible();
  });
});

test.describe('quote requests', () => {
  test('shows field errors and does not submit an empty form', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/inquiries', (r) => { calls++; return r.continue(); });
    await page.goto('/request-a-quote/');
    await page.getByRole('button', { name: 'Send quote request' }).click();
    await expect(page.locator('#quote-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#quote-name')).toBeFocused();
    await expect(page.locator('[data-error-for="email"]')).toBeVisible();
    await expect(page.locator('[data-error-for="consent"]')).toBeVisible();
    expect(calls).toBe(0);
  });

  test('submits a valid request and shows the platform reference', async ({ page }) => {
    await page.goto('/request-a-quote/?product=Boxing%20shorts');
    await expect(page.locator('#quote-product')).toHaveValue('Boxing shorts');
    await page.fill('#quote-name', 'Test Buyer');
    await page.fill('#quote-email', 'buyer@example.com');
    await page.fill('#quote-country', 'Germany');
    await page.fill('#quote-quantity', '300');
    await page.getByLabel('Private label (labels, hangtags)').check();
    await page.fill('#quote-message', 'Satin boxing shorts in black and gold with our logo.');
    await page.locator('#quote input[name="consent"]').check();
    const [req] = await Promise.all([
      page.waitForRequest('**/api/inquiries'),
      page.getByRole('button', { name: 'Send quote request' }).click(),
    ]);
    const body = req.postDataJSON();
    expect(body.request.quantity).toBe(300);
    expect(body.request.message).toContain('Customisation: Private label (labels, hangtags)');
    expect(req.headers()['idempotency-key']).toMatch(/^rfq:web:/);
    await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible();
    await expect(page.locator('[data-reference]')).toHaveText(/^inq_mock_/);
  });

  test('reports a platform failure without claiming success', async ({ page }) => {
    await page.route('**/api/inquiries', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"inquiry_unavailable"}' }));
    await page.goto('/contact/');
    await page.fill('#contact-name', 'Test Buyer');
    await page.fill('#contact-email', 'buyer@example.com');
    await page.fill('#contact-country', 'Canada');
    await page.fill('#contact-product', 'Hockey game jersey');
    await page.fill('#contact-quantity', '60');
    await page.fill('#contact-message', 'Game jerseys with laced collars.');
    await page.locator('#contact input[name="consent"]').check();
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#contact [data-form-status]')).toContainText(/could not be sent/i);
    await expect(page.getByRole('heading', { name: 'Request received' })).toBeHidden();
    await expect(page.locator('#contact-name')).toHaveValue('Test Buyer');
  });

  test('kit designer preselects from links and sends the full specification', async ({ page }) => {
    await page.goto('/design-your-kit/?sport=basketball&garment=basketball-game-jersey');
    await expect(page.locator('#kit-sport')).toHaveValue('Basketball kit');
    await expect(page.getByLabel('Basketball game jersey')).toBeChecked();
    await expect(page.locator('[data-out="garments"]')).toHaveText('Basketball game jersey');
    await page.getByLabel('Basketball game shorts').check();
    await page.getByRole('button', { name: 'Red' }).click();
    await expect(page.locator('#kit-primary')).toHaveValue('#c8102e');
    await page.getByLabel('Player numbers').check();
    await page.fill('#kit-quantity', '45');
    await page.fill('#kit-name', 'Coach Test');
    await page.fill('#kit-email', 'coach@example.com');
    await page.fill('#kit-country', 'United States');
    await page.locator('#kit input[name="consent"]').check();
    const [req] = await Promise.all([
      page.waitForRequest('**/api/inquiries'),
      page.getByRole('button', { name: 'Send kit request' }).click(),
    ]);
    const msg: string = req.postDataJSON().request.message;
    expect(msg).toContain('Garments: Basketball game jersey, Basketball game shorts');
    expect(msg).toContain('Main colour: #c8102e');
    expect(msg).toContain('Branding: Player numbers');
    expect(req.postDataJSON().request.productReferences).toEqual(['Basketball kit']);
    await expect(page.getByRole('heading', { name: 'Kit request received' })).toBeVisible();
  });
});

test.describe('motion', () => {
  test('content below the hero animates in on scroll and stays visible', async ({ page }) => {
    test.skip(isMobile(page), 'desktop only');
    await page.goto('/custom-manufacturing/');
    await page.waitForTimeout(1500);
    const item = page.locator('.qc-list li').first();
    await item.scrollIntoViewIfNeeded();
    await expect(item).toHaveCSS('opacity', '1', { timeout: 5000 });
    await expect(page.locator('.process-line').first()).toHaveCount(1);
  });

  test('horizontal overflow stays at zero while the hero is pinned', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(1500);
    await noHorizontalScroll(page);
  });
});

test.describe('layout and accessibility', () => {
  for (const path of ['/', '/collections/', '/collections/american-football/', '/collections/wrestling/', '/collections/leggings/', '/collections/bjj/bjj-gi/', '/custom-manufacturing/', '/design-your-kit/', '/request-a-quote/', '/about/', '/contact/']) {
    test(`no horizontal overflow and no serious axe violations: ${path}`, async ({ page }) => {
      // Audit the settled design: with reduced motion every element renders at rest,
      // so axe never samples a half-faded element mid-animation.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      // content-visibility:auto leaves off-screen sections unrendered, which makes axe
      // sample the wrong background; render everything so the real design is audited.
      await page.addStyleTag({ content: '* { content-visibility: visible !important; }' });
      await noHorizontalScroll(page);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
