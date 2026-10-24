/**
 * Home hero: scroll-driven sport showcase (the original template's signature motion).
 *
 * The hero pins while you scroll; each step flies the next garment out of the
 * "Next up" card into the stage, cross-fades the cinematic background, swaps the
 * outlined sport word and caption, and advances the counter/progress bar.
 * Scrolling snaps to each sport. Tabs and "Next up" scroll to a sport.
 * With prefers-reduced-motion the hero is not pinned and tabs simply switch.
 */
// GSAP is imported lazily inside setupScroll() so it never competes with first paint.
const hero = document.querySelector<HTMLElement>('[data-hero]');

// The pinned hero always opens on the first sport: don't restore a mid-hero scroll position.
if (hero && 'scrollRestoration' in history && !location.hash) {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

if (hero) {
  const $$ = <T extends Element = HTMLElement>(sel: string) => [...hero.querySelectorAll<T>(sel)] as T[];
  const bgs = $$('[data-hero-bg]');
  const garments = $$('[data-hero-garment]');
  const words = $$('[data-hero-word]');
  const captions = $$('[data-hero-caption]');
  const thumbs = $$<HTMLImageElement>('[data-hero-thumb]');
  const tabs = $$<HTMLButtonElement>('[data-hero-tab]');
  const now = hero.querySelector<HTMLElement>('[data-hero-now]')!;
  const bar = hero.querySelector<HTMLElement>('[data-hero-bar]')!;
  const nextBtn = hero.querySelector<HTMLButtonElement>('[data-hero-next]')!;
  const nextName = hero.querySelector<HTMLElement>('[data-hero-next-name]')!;
  const stage = hero.querySelector<HTMLElement>('[data-hero-stage]')!;
  const count = garments.length;
  const names = tabs.map((t) => t.textContent!.trim());
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hydrate = (img: HTMLImageElement | null) => {
    if (!img || img.getAttribute('src')) return;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src!;
  };
  const hydrateAll = () => {
    garments.forEach((g) => hydrate(g.querySelector('img')));
    bgs.forEach((b) => hydrate(b.querySelector('img')));
  };

  let current = 0;
  function setIndex(i: number) {
    current = i;
    now.textContent = String(i + 1).padStart(2, '0');
    tabs.forEach((t, n) => t.setAttribute('aria-pressed', String(n === i)));
    garments.forEach((g, n) => g.toggleAttribute('aria-hidden', n !== i));
    captions.forEach((c, n) => { c.inert = n !== i; });
    nextName.textContent = names[(i + 1) % count];
    // Keep the active tab visible by scrolling only the tab strip (never the window).
    const strip = tabs[i]?.parentElement;
    if (strip) {
      const tab = tabs[i];
      const left = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, left), behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  // The load-in intro is pure CSS (global.css, .hero-intro) so it never waits for JS.

  if (reduced) {
    // ------------------------------------------------- reduced motion: click to switch
    hero.classList.add('is-static');
    const show = (i: number) => {
      hydrate(garments[i].querySelector('img'));
      hydrate(bgs[i].querySelector('img'));
      garments.forEach((g, n) => { g.dataset.active = String(n === i); });
      bgs.forEach((b, n) => { b.dataset.active = String(n === i); });
      words.forEach((w, n) => { w.style.opacity = n === i ? '1' : '0'; });
      captions.forEach((c, n) => { c.style.opacity = n === i ? '1' : '0'; });
      thumbs.forEach((t, n) => { t.style.opacity = n === (i + 1) % count ? '1' : '0'; });
      bar.style.transform = `scaleX(${i / (count - 1)})`;
      setIndex(i);
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));
    nextBtn.addEventListener('click', () => show((current + 1) % count));
  } else {
    // Build the pinned showcase once the page is idle so it never delays first paint.
    // Buttons work immediately: a click before the scroll setup is ready is queued.
    let goToReady: ((i: number) => void) | null = null;
    let queued: number | null = null;
    const request = (i: number) => { if (goToReady) goToReady(i); else queued = i; };
    tabs.forEach((t, i) => t.addEventListener('click', () => request(i)));
    nextBtn.addEventListener('click', () => request(current + 1 >= count ? 0 : current + 1));
    const build = () => {
      void setupScroll().then((goTo) => {
        goToReady = goTo;
        if (queued !== null) goTo(queued);
      });
    };
    const idle = () => requestAnimationFrame(() => requestAnimationFrame(() => ('requestIdleCallback' in window ? requestIdleCallback(build, { timeout: 1200 }) : setTimeout(build, 150))));
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  }

  async function setupScroll() {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsap.registerPlugin(ScrollTrigger);
    // ------------------------------------------------------ scroll-driven showcase
    hero!.classList.add('is-scroll');
    // Fetch the other slides' images on first scroll (or after a few seconds), not during load.
    window.addEventListener('scroll', hydrateAll, { once: true, passive: true });
    setTimeout(hydrateAll, 4000);

    gsap.set([...garments.slice(1), ...captions.slice(1), ...words.slice(1)], { autoAlpha: 0 });
    gsap.set(bgs.slice(1), { autoAlpha: 0 });
    gsap.set(bgs[0], { autoAlpha: 1 });
    // Opacity only (not visibility) so lazy thumbnails still load.
    gsap.set(thumbs, { opacity: 0 });
    gsap.set(thumbs[1], { opacity: 1 });
    gsap.set(bar, { scaleX: 0 });

    /** Offset that places a stage garment exactly over the "Next up" thumbnail. */
    const fromThumb = () => {
      const s = stage.getBoundingClientRect();
      const t = nextBtn.querySelector('.next-up-thumb')!.getBoundingClientRect();
      return {
        x: t.left + t.width / 2 - (s.left + s.width / 2),
        y: t.top + t.height / 2 - (s.top + s.height / 2),
        scale: Math.max(0.1, t.height / s.height),
      };
    };

    const HOLD = 0.6;
    const STEP = 1;
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    // No opening hold: the first scroll movement immediately starts the next sport.
    tl.addLabel('s0', 0);

    for (let i = 1; i < count; i++) {
      const t = (i - 1) * (STEP + HOLD);
      tl.to(garments[i - 1], { yPercent: -60, scale: 0.86, rotate: -4, autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, t)
        .fromTo(garments[i],
          { x: () => fromThumb().x, y: () => fromThumb().y, scale: () => fromThumb().scale, rotate: 6, autoAlpha: 1 },
          { x: 0, y: 0, scale: 1, rotate: 0, duration: STEP, ease: 'power3.out', immediateRender: false }, t)
        .set(thumbs[i], { opacity: 0 }, t)
        .fromTo(thumbs[(i + 1) % count], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, immediateRender: false }, t + 0.7)
        .to(bgs[i - 1], { autoAlpha: 0, scale: 1.08, duration: STEP * 0.7, ease: 'power1.in' }, t)
        .fromTo(bgs[i], { autoAlpha: 0, scale: 1.14 }, { autoAlpha: 1, scale: 1.02, duration: STEP * 0.7, ease: 'power2.out', immediateRender: false }, t)
        .to(words[i - 1], { autoAlpha: 0, xPercent: -10, duration: 0.5 }, t)
        .fromTo(words[i], { autoAlpha: 0, xPercent: 10 }, { autoAlpha: 1, xPercent: 0, duration: 0.7, immediateRender: false }, t + 0.35)
        .to(captions[i - 1], { autoAlpha: 0, y: -30, duration: 0.4, ease: 'power2.in' }, t)
        .fromTo(captions[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, t + 0.5)
        .to(bar, { scaleX: i / (count - 1), duration: STEP, ease: 'none' }, t)
        .addLabel(`s${i}`, t + STEP)
        .to({}, { duration: HOLD });
    }

    const total = tl.duration();
    const labelTimes = Array.from({ length: count }, (_, i) => tl.labels[`s${i}`]);
    const indexAt = (time: number) => {
      let best = 0;
      labelTimes.forEach((lt, i) => { if (time >= lt - STEP * 0.45) best = i; });
      return best;
    };

    const mobile = matchMedia('(max-width: 999px)');
    // CSS sticky "pin": the wrapper provides the scroll distance and the hero sticks
    // inside it. Unlike ScrollTrigger's pin, nothing is re-parented, so the hero's
    // images are never re-painted as a late LCP.
    const wrap = hero!.parentElement as HTMLElement;
    const distance = () => innerHeight * (mobile.matches ? 0.32 : 0.62) * (count - 1) * 1.4;
    // On short screens the hero is taller than the viewport: stick once its bottom is in view.
    const stickyTop = () => Math.min(0, innerHeight - hero!.offsetHeight);
    const layout = () => {
      hero!.style.top = `${stickyTop()}px`;
      wrap.style.height = `${hero!.offsetHeight + distance()}px`;
    };
    layout();
    wrap.classList.add('is-sticky');

    const st = ScrollTrigger.create({
      trigger: wrap,
      // Start at the very top of the page, even when the hero is taller than the screen.
      start: 'top top',
      end: () => `+=${distance() - stickyTop()}`,
      // Low smoothing so the change follows the finger/wheel from the first pixel.
      scrub: 0.3,
      animation: tl,
      invalidateOnRefresh: true,
      onRefreshInit: layout,
      snap: {
        snapTo: labelTimes.map((lt) => lt / total).concat([1]),
        duration: { min: 0.25, max: 0.8 },
        delay: 0.08,
        ease: 'power2.inOut',
        // No velocity prediction: one gesture moves exactly one sport.
        inertia: false,
        directional: true,
      },
      onUpdate: (self) => {
        const i = indexAt(self.progress * total);
        if (i !== current) setIndex(i);
      },
    });

    const goTo = (i: number) => {
      const clamped = Math.max(0, Math.min(count - 1, i));
      const y = st.start + (st.end - st.start) * (labelTimes[clamped] / total);
      window.scrollTo({ top: y, behavior: 'smooth' });
    };

    // Gentle cursor parallax on the garment (desktop pointers only).
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const qx = gsap.quickTo(stage, 'x', { duration: 0.8, ease: 'power3' });
      const qy = gsap.quickTo(stage, 'y', { duration: 0.8, ease: 'power3' });
      hero!.addEventListener('pointermove', (e) => {
        qx((e.clientX / innerWidth - 0.5) * 18);
        qy((e.clientY / innerHeight - 0.5) * 14);
      });
    }
    return goTo;
  }
  // Initial state (slide 01) is already in the markup; calling setIndex(0) here would
  // force a synchronous layout before first paint.
}
