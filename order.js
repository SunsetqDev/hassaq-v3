/* Direct restaurant links: ordering takes place in the selected delivery service. */
(() => {
  const SERVICES = [
    { name: 'Glovo', url: 'https://glovoapp.com/ru/kz/aktobe/stores/hassaq-akx', cls: 'glovo' },
    { name: 'Яндекс Еда', url: 'https://eda.yandex.kz/ru-kz/Actobe/r/hassaq', cls: 'yandex' }
  ];
  const TEXT = {
    ru: { title: 'Hassaq с доставкой', text: 'Выберите сервис и оформите заказ в меню ресторана.', menu: 'Открыть меню', note: 'Актуальные цены, зона и стоимость доставки — в выбранном сервисе.', close: 'Закрыть' },
    kk: { title: 'Hassaq жеткізу қызметі', text: 'Қызметті таңдап, мейрамхана мәзірінен тапсырыс беріңіз.', menu: 'Мәзірді ашу', note: 'Өзекті бағалар, жеткізу аймағы мен құны — таңдалған қызметте.', close: 'Жабу' }
  };
  const dialog = document.createElement('dialog');
  dialog.className = 'delivery-dialog';
  dialog.setAttribute('aria-labelledby', 'delivery-title');
  dialog.setAttribute('aria-describedby', 'delivery-description');
  document.body.appendChild(dialog);
  function render() {
    const t = TEXT[window.HQ?.lang === 'kk' ? 'kk' : 'ru'];
    dialog.innerHTML = `<button class="delivery-close" aria-label="${t.close}">×</button>
      <p class="delivery-eyebrow">HASSAQ · DELIVERY</p>
      <h2 id="delivery-title">${t.title}</h2><p id="delivery-description">${t.text}</p>
      <div class="delivery-services">${SERVICES.map(s => `<a class="delivery-service delivery-service--${s.cls}" href="${s.url}" target="_blank" rel="noopener"><b>${s.name}</b><span>${t.menu} ↗</span></a>`).join('')}</div>
      <p class="delivery-note">${t.note}</p>`;
    dialog.querySelector('.delivery-close').onclick = () => dialog.close();
  }
  function open() { render(); if (!dialog.open) dialog.showModal(); }
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  document.addEventListener('click', e => { if (e.target.closest('[data-order]')) { e.preventDefault(); open(); } });
  addEventListener('hassaq-lang', () => { if (dialog.open) render(); });
  window.HQOrder = { open, close: () => dialog.close() };
})();
