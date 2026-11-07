/*
  Оформление заказа через Glovo или Яндекс Еду.
  Glovo и Яндекс Еда не дают сторонним сайтам класть блюда в свою корзину (это возможно только
  через официальную партнёрскую интеграцию кафе). Поэтому сайт: 1) копирует список заказа,
  2) открывает Hassaq в выбранном сервисе, 3) показывает чек-лист, какие блюда добавить.
  Любой элемент с атрибутом data-order открывает это окно.
*/
(() => {
  const SERVICES = {
    glovo:  { name: 'Glovo',       url: 'https://glovoapp.com/ru/kz/aktobe/stores/hassaq-akx', color: '#ffc244', ink: '#00a082' },
    yandex: { name: 'Яндекс Еда',  url: 'https://eda.yandex.kz/ru-kz/Actobe/r/hassaq',         color: '#fce000', ink: '#21201f' }
  };
  const TXT = {
    ru: { title: 'Как заказать?', sub: 'Выберите сервис доставки', empty: 'Корзина пуста — откроем меню Hassaq в приложении.',
          list: 'Ваш заказ', total: 'Итого', copied: 'Список скопирован', hint: 'Мы открыли Hassaq в {s}. Добавьте эти блюда в корзину — отмечайте галочкой, что уже добавили. Список скопирован: его можно вставить в комментарий к заказу.',
          again: 'Открыть {s} ещё раз', close: 'Готово', note: 'Glovo и Яндекс Еда не позволяют сайтам добавлять блюда в их корзину напрямую.' },
    kk: { title: 'Қалай тапсырыс беруге болады?', sub: 'Жеткізу қызметін таңдаңыз', empty: 'Себет бос — Hassaq мәзірін қосымшада ашамыз.',
          list: 'Сіздің тапсырысыңыз', total: 'Барлығы', copied: 'Тізім көшірілді', hint: 'Hassaq-ты {s} қосымшасында аштық. Осы тағамдарды себетке қосыңыз — қосқанын белгілеп отырыңыз. Тізім көшірілді: оны тапсырысқа түсініктеме ретінде қоюға болады.',
          again: '{s} қайта ашу', close: 'Дайын', note: 'Glovo мен Яндекс Еда сайттарға тағамды олардың себетіне тікелей қосуға рұқсат бермейді.' }
  };
  const lang = () => (window.HQ && HQ.lang === 'kk') ? 'kk' : 'ru';
  const t = (k, s) => TXT[lang()][k].replace('{s}', s || '');
  const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' тг';

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
  .om__list{margin:18px 0 6px;border-top:1px solid var(--line,rgba(74,36,20,.14))}
  .om__list label{display:flex;align-items:center;gap:10px;padding:11px 2px;border-bottom:1px solid var(--line,rgba(74,36,20,.14));font-size:14px;cursor:pointer}
  .om__list input{width:18px;height:18px;accent-color:#e0823a}
  .om__list span{flex:1}
  .om__list label:has(input:checked) span{text-decoration:line-through;opacity:.55}
  .om__list b{white-space:nowrap}
  .om__total{display:flex;justify-content:space-between;font-size:17px;font-weight:800;padding:10px 2px}
  .om__hint{font-size:13px;line-height:1.55;color:var(--muted,#8a6a55);background:var(--surface-2,#efe0c8);border-radius:14px;padding:12px 14px;margin-top:10px}
  .om__note{font-size:11px;color:var(--muted,#8a6a55);margin-top:14px;text-align:center}
  .om__row{display:flex;gap:10px;margin-top:16px}
  .om__row button{flex:1;padding:13px;border-radius:999px;font-weight:800;font-size:14px}
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

  function choose() {
    const items = api.getCart();
    card.innerHTML = `<h3>${t('title')}</h3><p class="om__sub">${items.length ? t('sub') : t('empty')}</p>
      <div class="om__svc">${Object.entries(SERVICES).map(([k, s]) =>
        `<button data-svc="${k}" style="background:${s.color};color:${s.ink}">${s.name}<small>Hassaq · Ақтөбе ↗</small></button>`).join('')}</div>
      ${items.length ? listHTML(items, false) : ''}
      <p class="om__note">${t('note')}</p>`;
  }
  async function go(key) {
    const s = SERVICES[key], items = api.getCart();
    window.open(s.url, '_blank', 'noopener');
    if (!items.length) { close(); return; }
    const ok = await copy(orderText(items));
    card.innerHTML = `<h3>${s.name}</h3>
      ${ok ? `<div class="om__toast">✓ ${t('copied')}</div>` : ''}
      <p class="om__hint">${t('hint', s.name)}</p>
      ${listHTML(items, true)}
      <div class="om__row"><button class="om__ghost" data-svc="${key}">${t('again', s.name)}</button><button data-close style="background:#e0823a;color:#fff">${t('close')}</button></div>`;
  }
  function open() { choose(); root.classList.add('is-open'); }
  function close() { root.classList.remove('is-open'); }

  root.addEventListener('click', e => {
    const svc = e.target.closest('[data-svc]');
    if (svc) { go(svc.dataset.svc); return; }
    if (e.target === root || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-order]'); if (b) { e.preventDefault(); open(); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  api.open = open; api.close = close; api.SERVICES = SERVICES;
  window.HQOrder = api;
})();
