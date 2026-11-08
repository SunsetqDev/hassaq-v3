/*
  Оформление заказа через Glovo или Яндекс Еду — в приложении или на сайте.
  Glovo и Яндекс Еда не дают сторонним сайтам класть блюда в свою корзину (это возможно только
  через официальную партнёрскую интеграцию кафе). Поэтому сайт: 1) копирует список заказа,
  2) открывает Hassaq в выбранном сервисе — в приложении или в браузере, 3) показывает чек-лист.

  Как открывается приложение:
  • Android — intent-ссылка: открывает приложение на странице Hassaq, а если его нет — Google Play.
  • iPhone — универсальная ссылка (glovoapp.com / eda.yandex.kz): iOS сама открывает приложение,
    если оно установлено; иначе страница откроется в браузере, и мы покажем ссылку на App Store.
  • Компьютер — приложения нет, поэтому показываем ссылки на магазины и предлагаем сайт.
  Любой элемент с атрибутом data-order открывает это окно.
*/
(() => {
  const SERVICES = {
    glovo: {
      name: 'Glovo', url: 'https://glovoapp.com/ru/kz/aktobe/stores/hassaq-akx', color: '#ffc244', ink: '#00a082', site: 'glovoapp.com',
      android: 'com.glovo', ios: 'https://apps.apple.com/kz/app/id951812684'
    },
    yandex: {
      name: 'Яндекс Еда', url: 'https://eda.yandex.kz/ru-kz/Actobe/r/hassaq', color: '#fce000', ink: '#21201f', site: 'eda.yandex.kz',
      android: 'ru.foodfox.client', ios: 'https://apps.apple.com/kz/app/id1078986931'
    }
  };
  const play = pkg => `https://play.google.com/store/apps/details?id=${pkg}`;

  const TXT = {
    ru: { title: 'Как заказать?', sub: 'Выберите сервис доставки', empty: 'Корзина пуста — откроем меню Hassaq в сервисе.',
          how: 'Где открыть {s}?', back: '← Другой сервис', back2: '← Назад',
          app: 'Приложение', appSub: 'Откроется {s} на телефоне', web: 'Сайт', webSub: 'Откроется {d} в браузере',
          remember: 'Запомнить выбор',
          list: 'Ваш заказ', total: 'Итого', copied: 'Список скопирован',
          hintWeb: 'Мы открыли Hassaq на сайте {s}. Добавьте эти блюда в корзину — отмечайте галочкой, что уже добавили. Список скопирован: его можно вставить в комментарий к заказу.',
          hintApp: 'Открываем Hassaq в приложении {s}. Добавьте эти блюда в корзину — отмечайте галочкой, что уже добавили. Список скопирован: его можно вставить в комментарий к заказу.',
          noApp: 'Приложение не открылось? Установите {s}:',
          desk: 'Приложение {s} работает на телефоне. Установите его по ссылке ниже или закажите на сайте прямо сейчас.',
          deskWeb: 'Открыть сайт {s}',
          again: 'Открыть {s} ещё раз', close: 'Готово', note: 'Glovo и Яндекс Еда не позволяют сайтам добавлять блюда в их корзину напрямую.' },
    kk: { title: 'Қалай тапсырыс беруге болады?', sub: 'Жеткізу қызметін таңдаңыз', empty: 'Себет бос — Hassaq мәзірін қызметте ашамыз.',
          how: '{s} қайда ашылсын?', back: '← Басқа қызмет', back2: '← Артқа',
          app: 'Қосымша', appSub: '{s} телефонда ашылады', web: 'Сайт', webSub: '{d} браузерде ашылады',
          remember: 'Таңдауды есте сақтау',
          list: 'Сіздің тапсырысыңыз', total: 'Барлығы', copied: 'Тізім көшірілді',
          hintWeb: 'Hassaq-ты {s} сайтында аштық. Осы тағамдарды себетке қосыңыз — қосқанын белгілеп отырыңыз. Тізім көшірілді: оны тапсырысқа түсініктеме ретінде қоюға болады.',
          hintApp: 'Hassaq-ты {s} қосымшасында ашып жатырмыз. Осы тағамдарды себетке қосыңыз — қосқанын белгілеп отырыңыз. Тізім көшірілді: оны тапсырысқа түсініктеме ретінде қоюға болады.',
          noApp: 'Қосымша ашылмады ма? {s} орнатыңыз:',
          desk: '{s} қосымшасы телефонда жұмыс істейді. Төмендегі сілтеме арқылы орнатыңыз немесе қазір сайтта тапсырыс беріңіз.',
          deskWeb: '{s} сайтын ашу',
          again: '{s} қайта ашу', close: 'Дайын', note: 'Glovo мен Яндекс Еда сайттарға тағамды олардың себетіне тікелей қосуға рұқсат бермейді.' }
  };
  const lang = () => (window.HQ && HQ.lang === 'kk') ? 'kk' : 'ru';
  const t = (k, s, d) => TXT[lang()][k].replace('{s}', s || '').replace('{d}', d || '');
  const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' тг';

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isPhone = isIOS || isAndroid;

  const PREF = 'hassaq-order-mode';
  const pref = () => { try { return JSON.parse(localStorage.getItem(PREF) || 'null'); } catch { return null; } };
  const savePref = v => { try { v ? localStorage.setItem(PREF, JSON.stringify(v)) : localStorage.removeItem(PREF); } catch {} };

  const ICON = {
    app: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 3 2.7 15 0 18M12 3c-2.7 3-2.7 15 0 18"/></svg>'
  };

  const css = `
  .om{position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:16px;background:rgba(20,8,4,.6);opacity:0;pointer-events:none;transition:opacity .3s}
  .om.is-open{opacity:1;pointer-events:auto}
  .om__card{width:min(460px,100%);max-height:90vh;overflow:auto;border-radius:24px;background:var(--bg,#f6ecdc);color:var(--text,#2a140b);padding:24px;transform:translateY(20px) scale(.97);transition:transform .45s cubic-bezier(.2,.8,.2,1);box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}
  .om.is-open .om__card{transform:none}
  .om h3{font-family:var(--serif,Georgia),serif;font-weight:400;font-size:30px;line-height:1.1}
  .om__sub{color:var(--muted,#8a6a55);margin:6px 0 18px;font-size:14px}
  .om__svc{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .om__svc button{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:16px;border-radius:16px;font-weight:800;font-size:17px;text-align:left;transition:transform .2s}
  .om__svc button:hover{transform:translateY(-2px)}
  .om__svc small{font-weight:600;font-size:12px;opacity:.75}
  .om__badge{display:inline-flex;align-items:center;padding:5px 12px;border-radius:999px;font-weight:800;font-size:13px;margin-bottom:10px}
  .om__modes{display:grid;gap:10px}
  .om__mode{display:flex;align-items:center;gap:14px;width:100%;padding:16px;border-radius:16px;text-align:left;background:var(--surface,#fffaf2);border:1.5px solid var(--border-strong,rgba(74,36,20,.28));transition:border-color .2s,transform .2s}
  .om__mode:hover{border-color:#e0823a;transform:translateY(-2px)}
  .om__mode.is-pref{border-color:#e0823a;box-shadow:0 0 0 3px rgba(224,130,58,.18)}
  .om__mode i{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:14px}
  .om__mode i svg{width:24px;height:24px}
  .om__mode b{display:block;font-size:16px}
  .om__mode small{display:block;font-size:12.5px;color:var(--muted,#8a6a55);margin-top:2px}
  .om__mode em{margin-left:auto;font-style:normal;font-size:20px;opacity:.5}
  .om__rem{display:flex;align-items:center;gap:8px;margin-top:14px;font-size:13px;color:var(--muted,#8a6a55);cursor:pointer}
  .om__rem input{width:16px;height:16px;accent-color:#e0823a}
  .om__back{margin-top:16px;font-size:13px;font-weight:700;color:var(--muted,#8a6a55)}
  .om__back:hover{color:var(--text,#2a140b)}
  .om__list{margin:18px 0 6px;border-top:1px solid var(--line,rgba(74,36,20,.14))}
  .om__list label{display:flex;align-items:center;gap:10px;padding:11px 2px;border-bottom:1px solid var(--line,rgba(74,36,20,.14));font-size:14px;cursor:pointer}
  .om__list input{width:18px;height:18px;accent-color:#e0823a}
  .om__list span{flex:1}
  .om__list label:has(input:checked) span{text-decoration:line-through;opacity:.55}
  .om__list b{white-space:nowrap}
  .om__total{display:flex;justify-content:space-between;font-size:17px;font-weight:800;padding:10px 2px}
  .om__hint{font-size:13px;line-height:1.55;color:var(--muted,#8a6a55);background:var(--surface-2,#efe0c8);border-radius:14px;padding:12px 14px;margin-top:10px}
  .om__stores{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px;font-size:13px;color:var(--muted,#8a6a55)}
  .om__stores a{padding:8px 14px;border-radius:999px;background:var(--text,#2a140b);color:var(--bg,#f6ecdc);font-weight:800;font-size:12.5px}
  .om__note{font-size:11px;color:var(--muted,#8a6a55);margin-top:14px;text-align:center}
  .om__row{display:flex;gap:10px;margin-top:16px}
  .om__row button,.om__row a{flex:1;display:flex;align-items:center;justify-content:center;padding:13px;border-radius:999px;font-weight:800;font-size:14px;text-align:center}
  .om__ghost{border:1px solid var(--border-strong,rgba(74,36,20,.28))}
  .om__toast{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#2f7d32;margin-top:12px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const root = document.createElement('div');
  root.className = 'om'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
  root.innerHTML = '<div class="om__card"></div>';
  document.body.appendChild(root);
  const card = root.firstElementChild;

  const api = { getCart: () => [] };   // the page sets HQOrder.getCart = () => [{name, qty, price}]

  const orderText = items => {
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    return `Hassaq — ${t('list').toLowerCase()}:\n` + items.map(i => `• ${i.name} × ${i.qty} — ${fmt(i.qty * i.price)}`).join('\n') + `\n${t('total')}: ${fmt(total)}`;
  };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.parentNode.removeChild(ta); return ok;
    } catch { return false; }
  }
  const listHTML = (items, check) => {
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    return `<div class="om__list">${items.map(i => `<label>${check ? '<input type="checkbox">' : ''}<span>${i.name} × ${i.qty}</span><b>${fmt(i.qty * i.price)}</b></label>`).join('')}</div>
      <div class="om__total"><span>${t('total')}</span><span>${fmt(total)}</span></div>`;
  };
  const storesHTML = s => `<a href="${s.ios}" target="_blank" rel="noopener">App Store</a><a href="${play(s.android)}" target="_blank" rel="noopener">Google Play</a>`;
  const badge = s => `<span class="om__badge" style="background:${s.color};color:${s.ink}">${s.name}</span>`;

  /* шаг 1 — выбор сервиса */
  function choose() {
    const items = api.getCart();
    card.innerHTML = `<h3>${t('title')}</h3><p class="om__sub">${items.length ? t('sub') : t('empty')}</p>
      <div class="om__svc">${Object.entries(SERVICES).map(([k, s]) =>
        `<button data-svc="${k}" style="background:${s.color};color:${s.ink}">${s.name}<small>Hassaq · Ақтөбе</small></button>`).join('')}</div>
      ${items.length ? listHTML(items, false) : ''}
      <p class="om__note">${t('note')}</p>`;
  }

  /* шаг 2 — приложение или сайт */
  function how(key) {
    const s = SERVICES[key], p = pref();
    const isPref = m => p && p.svc === key && p.mode === m ? ' is-pref' : '';
    card.innerHTML = `${badge(s)}<h3>${t('how', s.name)}</h3><p class="om__sub"></p>
      <div class="om__modes">
        <button class="om__mode${isPref('app')}" data-go="${key}" data-mode="app">
          <i style="background:${s.color};color:${s.ink}">${ICON.app}</i><span><b>${t('app')}</b><small>${t('appSub', s.name)}</small></span><em>›</em></button>
        <button class="om__mode${isPref('web')}" data-go="${key}" data-mode="web">
          <i style="background:var(--surface-2,#efe0c8);color:var(--text,#2a140b)">${ICON.web}</i><span><b>${t('web')}</b><small>${t('webSub', s.name, s.site)}</small></span><em>›</em></button>
      </div>
      <label class="om__rem"><input type="checkbox" id="omRemember"${p && p.svc === key ? ' checked' : ''}>${t('remember')}</label>
      <button class="om__back" data-step="choose">${t('back')}</button>`;
  }

  function openApp(s) {
    if (isAndroid) {
      // Android: открыть приложение на странице Hassaq, нет приложения → Google Play
      const u = new URL(s.url);
      location.href = `intent://${u.host}${u.pathname}#Intent;scheme=https;package=${s.android};S.browser_fallback_url=${encodeURIComponent(play(s.android))};end`;
    } else {
      // iPhone: универсальная ссылка — iOS откроет приложение, если оно установлено
      window.open(s.url, '_blank', 'noopener');
    }
  }

  /* шаг 3 — открываем и показываем чек-лист */
  async function go(key, mode) {
    const s = SERVICES[key], items = api.getCart();
    const rem = card.querySelector('#omRemember');
    if (rem) savePref(rem.checked ? { svc: key, mode } : null);

    if (mode === 'app' && !isPhone) {   // на компьютере приложения нет
      card.innerHTML = `${badge(s)}<h3>${t('app')}</h3>
        <p class="om__hint">${t('desk', s.name)}</p>
        <div class="om__stores">${storesHTML(s)}</div>
        <div class="om__row"><button class="om__ghost" data-step="how" data-svc-key="${key}">${t('back2')}</button>
        <button data-go="${key}" data-mode="web" style="background:#e0823a;color:#fff">${t('deskWeb', s.site)}</button></div>`;
      return;
    }

    if (mode === 'app') openApp(s); else window.open(s.url, '_blank', 'noopener');
    if (!items.length) { close(); return; }
    const ok = await copy(orderText(items));
    card.innerHTML = `${badge(s)}<h3>${mode === 'app' ? t('app') : t('web')}</h3>
      ${ok ? `<div class="om__toast">✓ ${t('copied')}</div>` : ''}
      <p class="om__hint">${t(mode === 'app' ? 'hintApp' : 'hintWeb', s.name)}</p>
      ${mode === 'app' ? `<div class="om__stores">${t('noApp', s.name)} ${storesHTML(s)}</div>` : ''}
      ${listHTML(items, true)}
      <div class="om__row"><button class="om__ghost" data-go="${key}" data-mode="${mode}">${t('again', s.name)}</button><button data-close style="background:#e0823a;color:#fff">${t('close')}</button></div>`;
  }

  function open() {
    const p = pref();
    if (p && SERVICES[p.svc]) how(p.svc); else choose();
    root.classList.add('is-open');
  }
  function close() { root.classList.remove('is-open'); }

  root.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) { go(g.dataset.go, g.dataset.mode); return; }
    const svc = e.target.closest('[data-svc]');
    if (svc) { how(svc.dataset.svc); return; }
    const step = e.target.closest('[data-step]');
    if (step) { step.dataset.step === 'how' ? how(step.dataset.svcKey) : choose(); return; }
    if (e.target === root || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-order]'); if (b) { e.preventDefault(); open(); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  api.open = open; api.close = close; api.SERVICES = SERVICES;
  window.HQOrder = api;
})();
