// Покупка комплекта: сервер /freelancer/api решает, открыты ли продажи. Пока ЮKassa не подключена — кнопка выключена.
(function () {
  const button = document.querySelector('#checkoutButton');
  const status = document.querySelector('#checkoutStatus');
  const form = document.querySelector('#buyForm');
  const email = document.querySelector('#buyEmail');
  const offer = document.querySelector('#buyOffer');
  if (!button || !status) return;
  button.disabled = true;
  const say = (text) => { status.textContent = text; };

  fetch('/api/freelancer/shop', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .catch(() => ({ enabled: false }))
    .then((shop) => {
      if (!shop.enabled) { say('Продажи пока не открыты. Скоро здесь можно будет оплатить комплект.'); return; }
      if (form) form.hidden = false;
      button.disabled = false;
      say('');
    });

  button.addEventListener('click', async () => {
    const value = (email && email.value || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value)) { say('Укажите e-mail: на него придёт чек, а на странице после оплаты — ссылка на скачивание.'); email && email.focus(); return; }
    if (offer && !offer.checked) { say('Отметьте согласие с условиями оферты.'); offer.focus(); return; }
    if (window.siteGoal) window.siteGoal('buy_click');
    button.disabled = true;
    say('Создаём платёж…');
    try {
      const r = await fetch('/api/freelancer/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, offer: true }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.confirmation_url) throw new Error(data.error || 'Не удалось создать платёж');
      try { localStorage.setItem('freelancerOrder', JSON.stringify({ o: data.order, k: data.key })); } catch (e) { /* приватный режим */ }
      window.location.href = data.confirmation_url;
    } catch (e) {
      say(e.message + '. Попробуйте ещё раз или напишите нам.');
      button.disabled = false;
    }
  });
})();
