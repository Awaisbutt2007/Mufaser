/**
 * GSAP-powered scroll motion, loaded lazily by site-motion.ts when the page is idle.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
ScrollTrigger.config({ ignoreMobileResize: true });

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)] as T[];

/** Let the browser handle input/paint between setup steps (keeps tasks short). */
const yieldTask = () => new Promise<void>((r) => setTimeout(r, 0));

export async function setupMotion() {
  // ------------------------------------------------ headline line reveals
  const headings = $$(
    '.section-head h2.display, .final-cta h2, .custom-copy h2, .split h2.display, .collection-toolbar h2',
  ).filter((h) => !h.closest('[data-hero]') && h.getBoundingClientRect().top > innerHeight);
  document.fonts.ready.then(() => {
    headings.forEach((h) => {
      const split = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'line' });
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.1,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true },
      });
    });
    ScrollTrigger.refresh();
  });


  await yieldTask();
  // ------------------------------------------------ image clip reveals
  $$('.option-card .m, .perf-feature, .gallery-main, .why-item .ic').forEach((el) => {
    gsap.fromTo(el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  await yieldTask();
  // ------------------------------------------------ staggered card batches
  const batch = (selector: string, vars: gsap.TweenVars) => {
    // Cards in filterable grids are excluded: filtering moves hidden cards into view.
    const items = $$(selector).filter((el) => !el.closest('[data-results], [data-collection]'));
    if (!items.length) return;
    gsap.set(items, { autoAlpha: 0, transition: 'none', ...vars });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.to(els, {
        autoAlpha: 1, y: 0, x: 0, scale: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true,
        // Hand transforms back to CSS so hover effects keep working.
        onComplete: () => gsap.set(els, { clearProps: 'transition,transform,opacity,visibility' }),
      }),
    });
  };
  batch('.sport-card', { y: 60, scale: 0.96 });
  batch('.product-card', { y: 50 });
  batch('.perf-tile', { y: 40, scale: 0.95 });
  batch('.collection-link', { y: 30 });
  batch('.combat-link', { x: -24 });
  batch('.hero-strip li', { y: 20 });

  await yieldTask();
  // ------------------------------------------------ parallax
  $$('.page-hero-bg, .final-cta img.bg').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: img.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  $$('.perf-feature img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -5 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: img.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  await yieldTask();
  // ------------------------------------------------ marquee (scroll-velocity)
  $$('[data-marquee]').forEach((m) => {
    const track = m.querySelector<HTMLElement>('.marquee-track')!;
    track.append(...[...track.children].map((c) => c.cloneNode(true)));
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      trigger: m,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        if (v !== 0) dir = v > 0 ? 1 : -1;
        const boost = Math.min(Math.abs(v) / 250, 6);
        gsap.to(loop, { timeScale: dir * (1 + boost), duration: 0.3, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.3, overwrite: false });
      },
    });
  });

  await yieldTask();
  // ------------------------------------------------ process timeline
  $$('.process').forEach((list) => {
    const line = document.createElement('span');
    line.className = 'process-line';
    line.setAttribute('aria-hidden', 'true');
    list.prepend(line);
    gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 75%', end: 'bottom 60%', scrub: true } });
    $$('li', list).forEach((li, i) => {
      // fromTo, not from: the steps are also `.reveal` (opacity 0 until revealed), so a
      // from() tween would animate back to opacity 0 and leave them invisible.
      gsap.fromTo(li, { y: 40, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', delay: (i % 3) * 0.1,
        scrollTrigger: { trigger: li, start: 'top 88%', once: true },
        onStart: () => li.classList.add('is-in'),
        onComplete: () => gsap.set(li, { clearProps: 'transform,opacity,visibility' }),
      });
      ScrollTrigger.create({ trigger: li, start: 'top 62%', onEnter: () => li.classList.add('is-on'), onLeaveBack: () => li.classList.remove('is-on') });
    });
  });

  await yieldTask();
  // ------------------------------------------------ QC list ticks
  $$('.qc-list').forEach((list) => {
    gsap.from($$('li', list), { x: -20, autoAlpha: 0, duration: 0.6, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: list, start: 'top 80%', once: true } });
  });

  await yieldTask();
  // ------------------------------------------------ magnetic primary buttons
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.btn--primary').forEach((btn) => {
      const qx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
      const qy = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.18);
        qy((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }

  await yieldTask();
  // ------------------------------------------------ Flip on product filters
  // Capture the layout before the page's own filter handler runs, animate after.
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('[data-filter]');
    if (!btn) return;
    const scope = btn.closest('section');
    const cards = scope ? $$('[data-product-card]', scope) : [];
    if (!cards.length || cards.length > 60) return;
    const state = Flip.getState(cards);
    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.6,
        ease: 'power3.inOut',
        scale: true,
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.9, duration: 0.3 }),
      });
    });
  }, true);

  await yieldTask();
  ScrollTrigger.refresh();

  // Sections using content-visibility report their real height only when rendered;
  // re-measure trigger positions whenever the page height changes.
  let pending = 0;
  let lastHeight = document.body.scrollHeight;
  new ResizeObserver(() => {
    const h = document.body.scrollHeight;
    if (Math.abs(h - lastHeight) < 2) return;
    lastHeight = h;
    clearTimeout(pending);
    pending = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  }).observe(document.body);
}
