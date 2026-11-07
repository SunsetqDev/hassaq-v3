(() => {
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const isMobile = matchMedia('(max-width:900px)').matches;
  const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' тг';
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* =========================================================
     THEME — Ақ (light) / Қара (dark), circular reveal from the button
     ========================================================= */
  const root = document.documentElement;
  const themeBox = $('#theme'), knob = $('#themeKnob');
  const syncSwitch = () => {
    const t = root.dataset.theme;
    $$('[data-theme-set]', themeBox).forEach(b => {
      const on = b.dataset.themeSet === t;
      b.setAttribute('aria-pressed', on);
      if (on) { knob.style.width = b.offsetWidth + 'px'; knob.style.transform = `translateX(${b.offsetLeft - 4}px)`; }
    });
  };
  function setTheme(t, fromEl) {
    if (t === root.dataset.theme) return;
    try { localStorage.setItem('hassaq-theme', t); } catch {}
    const apply = () => { root.dataset.theme = t; syncSwitch(); };
    if (document.startViewTransition && !reduce && fromEl) {
      const r = fromEl.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(apply).ready.then(() => {
        root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
      });
    } else {
      document.body.classList.add('theme-anim');
      apply();
      setTimeout(() => document.body.classList.remove('theme-anim'), 600);
    }
  }
  themeBox.addEventListener('click', e => { const b = e.target.closest('[data-theme-set]'); if (b) setTheme(b.dataset.themeSet, b); });
  // follow the system theme only while the visitor has not chosen one
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    let saved; try { saved = localStorage.getItem('hassaq-theme'); } catch {}
    if (!saved) { root.dataset.theme = e.matches ? 'dark' : 'light'; syncSwitch(); }
  });
  syncSwitch();
  document.fonts && document.fonts.ready.then(syncSwitch);
  addEventListener('resize', syncSwitch);

  /* =========================================================
     INTRO — the Hassaq emblem builds itself like a tournament opener:
     a ring of light is drawn, the cross slides in and locks,
     16 scroll pieces flip in around it, the whole sign turns in 3D,
     the background bursts with the ornament pattern, a gold glint passes.
     ========================================================= */
  const intro = $('#intro'), emb = $('#emb'), emb3d = $('#emb3d');
  const NS = 'http://www.w3.org/2000/svg';
  const HORN = 'M30 29V19C30 9 22 4 15 6 8 8 7 16 12 18.5 16 20.5 19.5 16.5 17 13.5M30 19C30 9 38 4 45 6 52 8 53 16 48 18.5 44 20.5 40.5 16.5 43 13.5';
  const d2r = a => a * Math.PI / 180;

  // ---- build the emblem (vector redraw of the ornament) ----
  let band = '', arms = '';
  for (let i = 0; i < 16; i++) {
    const up = i % 2 === 0;                       // big scroll curls outward, small one curls inward
    const a = i * 22.5;
    const sc = up ? .86 : .62, r = up ? 88 : 58;   // r = radius of the curled end
    const sw = (up ? 3.6 : 3.1) / sc;
    const inner = up
      ? `<path d="${HORN}" transform="translate(${-30 * sc} ${-r}) scale(${sc})" stroke-width="${sw}"/>`
      : `<path d="${HORN}" transform="translate(${30 * sc} ${-r}) scale(${-sc} ${-sc})" stroke-width="${sw}" />`;
    const cx = Math.sin(d2r(a)) * (up ? 77 : 66), cy = -Math.cos(d2r(a)) * (up ? 77 : 66);
    band += `<g class="eb" data-cx="${cx.toFixed(2)}" data-cy="${cy.toFixed(2)}" data-a="${a}"><g transform="rotate(${a})">${inner}</g></g>`;
  }
  for (let k = 0; k < 4; k++) {
    const ang = 45 + 90 * k;
    let bars = '';
    [-8.6, 0, 8.6].forEach(y => {
      bars += `<path d="M0 ${y - 3}H39L41 ${y - 4.2}H49.5V${y + 4.2}H41L39 ${y + 3}H0Z"/>`;
    });
    arms += `<g class="ea" data-ang="${ang}"><g transform="rotate(${ang})">${bars}</g></g>`;
  }
  emb.innerHTML = `
    <defs>
      <linearGradient id="eg" gradientUnits="userSpaceOnUse" x1="-100" y1="-100" x2="100" y2="100">
        <stop offset="0" stop-color="#fdd896"/><stop offset=".42" stop-color="#eb9a45"/><stop offset=".78" stop-color="#bb5d22"/><stop offset="1" stop-color="#7c3414"/>
      </linearGradient>
      <linearGradient id="shineG" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="flashG"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#ffe2ad" stop-opacity=".8"/><stop offset="1" stop-color="#f3b25c" stop-opacity="0"/></radialGradient>
      <mask id="shineMask" maskUnits="userSpaceOnUse" x="-110" y="-110" width="220" height="220"></mask>
    </defs>
    <g id="eArt">
      <g id="eRings" fill="none" stroke="url(#eg)">
        <circle class="er er--out" r="97" stroke-width="5.5" pathLength="1"/>
        <circle class="er" r="90.5" stroke-width="1.4" pathLength="1"/>
        <circle class="er er--in" r="52" stroke-width="5" pathLength="1"/>
      </g>
      <g id="eBand" fill="none" stroke="url(#eg)" stroke-linecap="round">${band}</g>
      <g id="eX" fill="url(#eg)" stroke="#5a2410" stroke-width=".45" stroke-linejoin="round">${arms}</g>
    </g>
    <g mask="url(#shineMask)"><g transform="rotate(25)"><rect id="eShine" x="-260" y="-160" width="70" height="320" fill="url(#shineG)"/></g></g>
    <circle id="eFlash" r="40" fill="url(#flashG)" opacity="0"/>
    <g id="eGlint"><circle cx="0" cy="-97" r="3.2" fill="#fff"/><circle cx="0" cy="-97" r="9" fill="url(#flashG)"/></g>`;
  // the shine is masked by a white copy of the artwork, so it only runs over the gold
  const maskEl = $('#shineMask', emb), art = $('#eArt', emb).cloneNode(true);
  art.removeAttribute('id');
  art.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  art.querySelectorAll('[stroke]').forEach(n => { if (n.getAttribute('stroke') !== 'none') n.setAttribute('stroke', '#fff'); });
  art.querySelectorAll('[fill]').forEach(n => { if (n.getAttribute('fill') !== 'none') n.setAttribute('fill', '#fff'); });
  maskEl.appendChild(art);

  const pieces = $$('#eBand .eb', emb), armEls = $$('#eX .ea', emb);
  const rings = $$('#eRings .er', emb);
  const shine = () => gsap.fromTo('#eShine', { attr: { x: -260 } }, { attr: { x: 190 }, duration: 1.1, ease: 'power2.inOut' });
  const idle = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.6 }).add(shine);
  const spin = gsap.to('#eBand', { rotation: 360, svgOrigin: '0 0', duration: 90, ease: 'none', repeat: -1, paused: true });
  let entered = false;

  (() => {
    const T = reduce ? .01 : 1;
    gsap.set(rings, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set('#eGlint', { opacity: 0 });
    pieces.forEach(p => {
      const a = d2r(+p.dataset.a), cx = +p.dataset.cx, cy = +p.dataset.cy;
      gsap.set(p, { x: Math.sin(a) * 170, y: -Math.cos(a) * 170, rotation: (+p.dataset.a % 45 ? -1 : 1) * 200, scaleX: -1, opacity: 0, svgOrigin: `${cx} ${cy}` });
    });
    armEls.forEach(el => {
      const a = d2r(+el.dataset.ang);
      gsap.set(el, { x: Math.cos(a) * 260, y: Math.sin(a) * 260, opacity: 0 });
    });
    gsap.timeline()
      .fromTo('.intro__glow', { scale: .2, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.4 * T, ease: 'power2.out' }, 0)
      // 1. a ring of light is drawn, a glint racing ahead of it
      .to('.er--out', { strokeDashoffset: 0, duration: 1.1 * T, ease: 'power3.inOut' }, .15)
      .set('#eGlint', { opacity: 1 }, .15)
      .fromTo('#eGlint', { rotation: 0, svgOrigin: '0 0' }, { rotation: 360, svgOrigin: '0 0', duration: 1.1 * T, ease: 'power3.inOut' }, .15)
      .to('#eGlint', { opacity: 0, duration: .25 }, 1.15)
      .to(rings[1], { strokeDashoffset: 0, duration: .9 * T, ease: 'power2.inOut' }, .45)
      // 2. the four arms of the cross shoot in along the diagonals and lock in the centre
      .to(armEls, { x: 0, y: 0, opacity: 1, duration: .75 * T, ease: 'expo.out', stagger: .09 }, .7)
      .fromTo('#eFlash', { scale: .2, opacity: 0, svgOrigin: '0 0' }, { scale: 1.6, opacity: 1, duration: .18, ease: 'power2.out', svgOrigin: '0 0' }, 1.15)
      .to('#eFlash', { opacity: 0, scale: 2.6, svgOrigin: '0 0', duration: .6, ease: 'power2.out' }, 1.33)
      .to('.er--in', { strokeDashoffset: 0, duration: .7 * T, ease: 'power2.inOut' }, 1.2)
      .set(rings, { strokeDasharray: 'none' }, 2)          // remove the dash seam once the rings are drawn
      // 3. sixteen scroll pieces flip in around the ring, one after another
      .to(pieces, { x: 0, y: 0, rotation: 0, scaleX: 1, opacity: 1, duration: .8 * T, ease: 'back.out(1.6)', stagger: { each: .045 } }, 1.35)
      // 4. the whole sign turns over in 3D, the background bursts with the pattern
      .fromTo(emb3d, { rotationY: 0 }, { rotationY: 360, duration: 1.4 * T, ease: 'power3.inOut' }, 2.35)
      .fromTo(emb3d, { scale: 1 }, { scale: 1.08, duration: .7, ease: 'power2.out', yoyo: true, repeat: 1 }, 2.35)
      .fromTo('#introPattern', { opacity: 0, scale: 1.5 }, { opacity: .32, scale: 1, duration: .9, ease: 'expo.out' }, 2.9)
      .to('#introPattern', { opacity: .07, duration: 1.4, ease: 'power2.out' }, 3.8)
      .fromTo('#introRays', { opacity: 0, rotation: -20 }, { opacity: 1, rotation: 0, duration: 1, ease: 'expo.out' }, 2.95)
      .to('#introRays', { opacity: .35, duration: 1.2 }, 3.9)
      .add(shine, 3.25)
      // 5. title and buttons
      .fromTo('#introBrand', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, 3.4)
      .fromTo('.wordmark', { letterSpacing: '.7em' }, { letterSpacing: '.16em', duration: 1.4, ease: 'expo.out' }, 3.4)
      .fromTo('#introActions', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'expo.out' }, 3.8)
      .add(() => { intro.classList.add('is-ready'); spin.play(); idle.play(); gsap.to('#introRays', { rotation: 360, duration: 120, ease: 'none', repeat: -1 }); }, 4.3);
  })();

  function enter(withSound) {
    if (entered) return; entered = true;
    if (withSound && window.HassaqMusic) HassaqMusic.start();
    window.scrollTo(0, 0);
    idle.pause();
    gsap.timeline()
      .to('#introActions, #introBrand', { opacity: 0, y: -20, duration: .4, ease: 'power2.in' })
      // the sign turns edge-on, pieces scatter outward, a flash opens the site
      .to(pieces, { x: (i, p) => Math.sin(d2r(+p.dataset.a)) * 140, y: (i, p) => -Math.cos(d2r(+p.dataset.a)) * 140, opacity: 0, duration: .8, ease: 'power3.in', stagger: .015 }, .05)
      .to(armEls, { x: (i, el) => Math.cos(d2r(+el.dataset.ang)) * 220, y: (i, el) => Math.sin(d2r(+el.dataset.ang)) * 220, opacity: 0, duration: .8, ease: 'power3.in' }, .2)
      .to(emb3d, { rotationY: '+=90', scale: 1.4, duration: .9, ease: 'power3.in' }, .15)
      .to('#introPattern, #introRays', { opacity: 0, duration: .6 }, .3)
      .to('.intro__glow', { scale: 4, opacity: 0, duration: 1, ease: 'expo.in' }, .3)
      .to(intro, { opacity: 0, duration: .5 }, .95)
      .add(() => {
        idle.kill(); spin.kill(); gsap.killTweensOf('#introRays'); intro.remove();
        document.body.classList.remove('locked');
        $('#music').classList.add('is-ready');
        pageIn(); window.__startBanner && window.__startBanner();
      }, 1.4);
  }
  $('#enterSound').addEventListener('click', () => enter(true));
  $('#enterMute').addEventListener('click', () => enter(false));

  const pageIn = () => gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.topbar, .header', { y: -30, opacity: 0, stagger: .08, duration: 1 }, 0)
    .from('.st', { y: 30, opacity: 0, scale: .8, stagger: .05, duration: .9 }, .15)
    .from('.banner', { y: 40, opacity: 0, duration: 1.1 }, .3)
    .from('.slide.is-active .slide__copy > *', { y: 30, opacity: 0, stagger: .08, duration: 1 }, .5)
    .from('.slide.is-active .slide__orn', { scale: .3, rotation: -180, opacity: 0, duration: 1.6 }, .4);

  /* ---------- music toggle ---------- */
  const musicBtn = $('#music');
  addEventListener('hassaq-music', e => {
    musicBtn.classList.toggle('is-on', e.detail);
    // when the real track (assets/music.mp3) plays, show its name
    if (window.HassaqMusic && HassaqMusic.mode === 'file') $('.music__label', musicBtn).textContent = 'Көңіл толқыны';
  });
  musicBtn.addEventListener('click', () => window.HassaqMusic && HassaqMusic.toggle());

  /* ---------- header shadow ---------- */
  ScrollTrigger.create({ start: 50, end: 'max', onToggle: s => $('#header').classList.toggle('is-stuck', s.isActive) });

  /* =========================================================
     STORIES
     ========================================================= */
  const GLOVO = 'https://glovoapp.com/ru/kz/aktobe/stores/hassaq-akx';
  // texts come from i18n.js (HQ.story); photos from ../assets/menu/<slug>.jpg
  const STORIES = [
    { id: 'kazy', photo: 'y3021642881', href: '#cat-doner', bg: 'brown' },
    { id: 'has', photo: 'y3021590799', href: '#cat-burger', bg: 'terra' },
    { id: 'doner', photo: 'y3021591284', href: '#cat-doner', bg: 'brown' },
    { id: 'kok', photo: 'y3021642882', href: '#cat-doner', bg: 'terra' },
    { id: 'burgers', photo: 'y3021590801', href: '#cat-burger', bg: 'brown' },
    { id: 'chicken', photo: 'y3021643131', href: '#cat-chicken', bg: 'terra' },
    { id: 'tantuni', photo: 'y3021643033', href: '#cat-tantuni', bg: 'brown' },
    { id: 'pizza', face: '<b>Пицца</b>', href: '#cat-pizza', bg: 'terra' },
    { id: 'drinks', photo: 'y3021844505', href: '#cat-drinks', bg: 'brown' },
    { id: 'yurt', img: 'assets/story-yurt.webp', href: '#about', bg: 'brown' },
    { id: 'glovo', face: '<b>Glovo</b>', href: GLOVO, bg: 'terra' }
  ];
  const seen = new Set(store.get('hassaq-seen', []));
  const row = $('#storiesRow');
  function renderStories() {
    row.innerHTML = '';
    STORIES.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'st' + (seen.has(s.id) ? ' is-seen' : '');
      b.innerHTML = `<span class="st__ring"><span class="st__in" style="background:${s.bg === 'brown' ? 'var(--brown-2)' : 'var(--terra)'}">${s.face || ''}</span></span><span class="st__label">${HQ.story(s.id)[0]}</span>`;
      const inner = $('.st__in', b);
      if (s.img) inner.innerHTML = `<img src="${s.img}" alt="">`;
      else if (s.photo) { inner.innerHTML = '<svg viewBox="0 0 80 48"><use href="#bowl"/></svg>'; photo(inner, s.photo, '', true); }
      b.addEventListener('click', () => openStory(i));
      row.appendChild(b);
    });
  }

  const storyEl = $('#story'), bars = $('#storyBars'), body = $('#storyBody');
  bars.innerHTML = STORIES.map(() => '<span><i></i></span>').join('');
  let si = 0, storyTween = null;
  function showStory(i) {
    if (i < 0) i = 0;
    if (i >= STORIES.length) return closeStory();
    si = i;
    const s = STORIES[i];
    seen.add(s.id); store.set('hassaq-seen', [...seen]);
    row.children[i].classList.add('is-seen');
    const tx = HQ.story(s.id);
    const ext = s.href.startsWith('http');
    const grad = s.bg === 'brown' ? '#6b3a22,#2a140b' : '#b8432a,#5e1a0e';
    const img = s.img || (s.photo ? `assets/menu/${s.photo}.jpg` : '');
    const bg = `<div class="sb__bg" style="background:radial-gradient(90% 70% at 50% 30%,${grad})">${img ? `<img src="${img}" alt="">` : ''}</div>`;
    body.innerHTML = `<div class="sb">${bg}<p class="sb__kz">${tx[1]}</p><h3>${tx[2]}</h3><p>${tx[3]}</p>
      ${s.id === 'glovo' ? `<button class="btn btn--orange" data-order data-sclose>${tx[4]}</button>` : `<a class="btn btn--orange" href="${s.href}" ${ext ? 'target="_blank" rel="noopener"' : 'data-sclose'}>${tx[4]}</a>`}</div>`;
    const sbImg = $('.sb__bg img', body); if (sbImg) sbImg.onerror = () => { sbImg.style.display = 'none'; };
    gsap.from('.sb > *:not(.sb__bg):not(.sb__orn)', { y: 20, opacity: 0, stagger: .06, duration: .6, ease: 'expo.out' });
    $$('i', bars).forEach((el, k) => gsap.set(el, { scaleX: k < i ? 1 : 0 }));
    storyTween && storyTween.kill();
    storyTween = gsap.to($$('i', bars)[i], { scaleX: 1, duration: 5, ease: 'none', onComplete: () => showStory(si + 1) });
  }
  function openStory(i) { storyEl.classList.add('is-open'); storyEl.setAttribute('aria-hidden', 'false'); showStory(i); }
  function closeStory() { storyTween && storyTween.kill(); storyEl.classList.remove('is-open'); storyEl.setAttribute('aria-hidden', 'true'); }
  $('#storyNext').addEventListener('click', () => showStory(si + 1));
  $('#storyPrev').addEventListener('click', () => showStory(si - 1));
  storyEl.addEventListener('click', e => { if (e.target === storyEl || e.target.closest('[data-sclose]')) closeStory(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeStory(); closeCart(); } });

  /* =========================================================
     BANNER CAROUSEL
     ========================================================= */
  const slides = $$('.slide'), dots = $$('#bannerDots button');
  let bi = 0, bTimer;
  function goSlide(i) {
    const prev = slides[bi];
    bi = (i + slides.length) % slides.length;
    const cur = slides[bi];
    prev.classList.remove('is-active'); cur.classList.add('is-active');
    dots.forEach((d, k) => { d.classList.remove('is-active'); void d.offsetWidth; d.classList.toggle('is-active', k === bi); });
    gsap.fromTo($$('.slide__copy > *', cur), { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: .07, duration: .9, ease: 'expo.out', delay: .15 });
    gsap.fromTo($('.slide__orn', cur), { scale: .6, opacity: 0 }, { scale: 1, opacity: '', duration: 1.4, ease: 'expo.out', clearProps: 'opacity' });
    clearTimeout(bTimer); bTimer = setTimeout(() => goSlide(bi + 1), 6000);
  }
  dots.forEach((d, k) => d.addEventListener('click', () => goSlide(k)));
  window.__startBanner = () => { dots[0].classList.remove('is-active'); void dots[0].offsetWidth; dots[0].classList.add('is-active'); bTimer = setTimeout(() => goSlide(1), 6000); };

  /* =========================================================
     MENU: sidebar + sections + search
     ========================================================= */
  const CATS = ['doner', 'tantuni', 'burger', 'chicken', 'pizza', 'extra', 'drinks'];
  // category thumbnails (real Hassaq photos)
  const CAT_THUMB = { doner: 'y3021591284', tantuni: 'y3021643033', burger: 'y3021590799', chicken: 'y3021643131', extra: 'y3021846277', drinks: 'y3021844505' };
  const MENU = (window.HASSAQ_MENU || []).map((it, i) => ({ ...it, id: it.photo || `${it.cat}-${i}` }));
  const side = $('#side'), catalog = $('#catalog');
  let spies = [], firstBuild = true;

  // photo slot: real photo from ../assets/menu/<slug>.(jpg|webp|png), branded placeholder underneath
  function ph(label) {
    const d = document.createElement('div'); d.className = 'ph';
    d.innerHTML = `<svg viewBox="0 0 80 48"><use href="#bowl"/></svg>${label ? `<em>${label}</em>` : ''}`;
    return d;
  }
  function photo(slot, slug, label, noPh) {
    if (!noPh) slot.appendChild(ph(label));
    if (!slug) return;
    const exts = ['jpg', 'webp', 'png', 'jpeg']; let i = 0;
    const im = new Image(); im.alt = label || ''; im.loading = 'lazy'; im.decoding = 'async';
    im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s';
    im.onload = () => { im.style.opacity = 1; };
    im.onerror = () => { if (++i < exts.length) im.src = `assets/menu/${slug}.${exts[i]}`; else im.style.display = 'none'; };
    im.src = `assets/menu/${slug}.${exts[0]}`;
    slot.appendChild(im);
  }

  function buildCatalog() {
    spies.forEach(t => t.kill()); spies = [];
    side.innerHTML = ''; catalog.innerHTML = '';
    CATS.forEach(key => {
      const items = MENU.filter(m => m.cat === key);
      const a = document.createElement('a');
      a.href = `#cat-${key}`; a.dataset.cat = key;
      const thumb = CAT_THUMB[key];
      a.innerHTML = `<span class="side__img">${thumb ? `<img src="assets/menu/${thumb}.jpg" alt="" loading="lazy">` : '<svg viewBox="0 0 80 48"><use href="#bowl"/></svg>'}</span><span class="side__name">${HQ.t('cat.' + key)}</span><i>${items.length}</i>`;
      side.appendChild(a);
      const sec = document.createElement('section');
      sec.className = 'cat'; sec.id = `cat-${key}`;
      sec.innerHTML = `<h3 class="cat__title"><svg><use href="#horn"/></svg>${HQ.t('cat.' + key)} <small>${items.length}</small></h3><div class="grid"></div>`;
      const grid = $('.grid', sec);
      items.forEach(it => {
        const d = HQ.dish(it);
        const c = document.createElement('article');
        c.className = 'card'; c.dataset.id = it.id;
        c.dataset.search = `${it.name} ${it.kz || ''} ${it.desc || ''} ${d.name} ${d.desc}`.toLowerCase();
        c.innerHTML = `<div class="card__img">${d.tag ? `<span class="card__tag">${d.tag}</span>` : ''}</div>
          <h3>${d.name}</h3>
          ${d.desc ? `<p>${d.desc}</p>` : ''}
          <div class="card__foot"><div class="card__price">${fmt(it.price)}<small>${d.weight}</small></div><div class="card__ctl"></div></div>`;
        photo($('.card__img', c), it.photo, d.name);
        grid.appendChild(c);
      });
      catalog.appendChild(sec);
      spies.push(ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: st => { if (st.isActive) $$('a', side).forEach(a => {
          a.classList.toggle('is-active', a.dataset.cat === key);
          if (isMobile && a.dataset.cat === key) side.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
        }); }
      }));
    });
    if (firstBuild) {
      firstBuild = false;
      ScrollTrigger.batch('.card', { start: 'top 92%', once: true,
        onEnter: els => gsap.from(els, { y: 40, opacity: 0, stagger: .06, duration: .8, ease: 'expo.out', clearProps: 'transform,opacity' }) });
    }
    ScrollTrigger.refresh();
  }
  buildCatalog();
  renderStories();

  // search
  $('#search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    let any = false;
    $$('.cat').forEach(sec => {
      let n = 0;
      $$('.card', sec).forEach(c => { const ok = !q || c.dataset.search.includes(q); c.classList.toggle('is-hidden', !ok); if (ok) n++; });
      sec.classList.toggle('is-hidden', n === 0); if (n) any = true;
    });
    $('#empty').classList.toggle('is-on', !any);
    if (q) document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    ScrollTrigger.refresh();
  });

  /* =========================================================
     CART
     ========================================================= */
  let cart = store.get('hassaq-cart', {});
  const byId = Object.fromEntries(MENU.map(m => [m.id, m]));
  Object.keys(cart).forEach(k => { if (!byId[k]) delete cart[k]; });
  const drawer = $('#drawer');
  const openCart = () => { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); };
  function closeCart() { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); }
  $('#cartBtn').addEventListener('click', openCart);
  drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeCart(); });

  const qtyHTML = (id, n) => `<div class="qty"><button data-dec="${id}" aria-label="−">−</button><b>${n}</b><button data-inc="${id}" aria-label="+">+</button></div>`;
  function renderCart() {
    store.set('hassaq-cart', cart);
    const ids = Object.keys(cart);
    const count = ids.reduce((s, k) => s + cart[k], 0);
    const total = ids.reduce((s, k) => s + cart[k] * byId[k].price, 0);
    $('#cartCount').textContent = count;
    $('#cartTotal').textContent = fmt(total);
    $('#cartList').innerHTML = ids.length ? ids.map(k => `<div class="ci"><div class="ci__name">${HQ.dish(byId[k]).name}<small>${fmt(byId[k].price)}</small></div>${qtyHTML(k, cart[k])}</div>`).join('')
      : `<p class="drawer__empty">${HQ.t('cart.empty')}</p>`;
    $$('.card').forEach(c => {
      const n = cart[c.dataset.id] || 0;
      $('.card__ctl', c).innerHTML = n ? qtyHTML(c.dataset.id, n) : `<button class="add" data-add="${c.dataset.id}" aria-label="${HQ.t('add')}">+</button>`;
    });
  }
  function flyFrom(el) {
    if (reduce) return;
    const a = el.getBoundingClientRect(), b = $('#cartBtn').getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'fly'; document.body.appendChild(d);
    gsap.set(d, { x: a.left + a.width / 2, y: a.top + a.height / 2 });
    gsap.timeline({ onComplete: () => { d.remove(); const cb = $('#cartBtn'); cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); } })
      .to(d, { x: b.left + b.width / 2, duration: .7, ease: 'power1.inOut' }, 0)
      .to(d, { y: b.top + b.height / 2, duration: .7, ease: 'back.in(1.6)' }, 0)
      .to(d, { scale: .4, duration: .7 }, 0);
  }
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]'), inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (add) { const id = add.dataset.add; cart[id] = 1; flyFrom(add); renderCart(); }
    else if (inc) { cart[inc.dataset.inc]++; renderCart(); }
    else if (dec) { const id = dec.dataset.dec; if (--cart[id] <= 0) delete cart[id]; renderCart(); }
  });
  renderCart();
  // order hand-off (order.js): current cart for Glovo / Яндекс Еда
  if (window.HQOrder) HQOrder.getCart = () => Object.keys(cart).map(k => ({ name: HQ.dish(byId[k]).name, qty: cart[k], price: byId[k].price }));
  $('#drawer').addEventListener('click', e => { if (e.target.closest('[data-order]')) closeCart(); });

  /* =========================================================
     LANGUAGE — ҚАЗ / РУС
     ========================================================= */
  const langBox = $('#lang'), langKnob = $('#langKnob');
  const syncLang = () => $$('[data-lang-set]', langBox).forEach(b => {
    const on = b.dataset.langSet === HQ.lang;
    b.setAttribute('aria-pressed', on);
    if (on) { langKnob.style.width = b.offsetWidth + 'px'; langKnob.style.transform = `translateX(${b.offsetLeft - 4}px)`; }
  });
  langBox.addEventListener('click', e => { const b = e.target.closest('[data-lang-set]'); if (b) HQ.set(b.dataset.langSet); });
  addEventListener('hassaq-lang', () => {
    gsap.fromTo('#catalog, #storiesRow, .banner, .about__copy', { opacity: .3 }, { opacity: 1, duration: .5 });
    renderStories(); buildCatalog(); renderCart(); syncLang(); syncSwitch();
    const q = $('#search').value; if (q) $('#search').dispatchEvent(new Event('input'));
    if (window.HassaqMusic && HassaqMusic.mode === 'file') $('.music__label').textContent = 'Көңіл толқыны';
  });
  syncLang();
  document.fonts && document.fonts.ready.then(syncLang);
  addEventListener('resize', syncLang);

  /* ---------- about reveal ---------- */
  gsap.from('.about__photo', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.about', start: 'top 80%' } });
  gsap.from('.about__copy > *', { y: 30, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.about', start: 'top 75%' } });
})();
