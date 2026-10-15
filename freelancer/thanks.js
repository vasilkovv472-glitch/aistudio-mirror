// Страница после оплаты: спрашивает сервер о статусе заказа и показывает кнопку скачивания.
(function () {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let o = params.get('o'), k = params.get('k');
  if (!o || !k) {
    try { const saved = JSON.parse(localStorage.getItem('freelancerOrder') || 'null'); if (saved) { o = saved.o; k = saved.k; } } catch (e) { /* нет хранилища */ }
  }
  const show = (title, text) => { $('title').textContent = title; $('text').textContent = text; };
  if (!o || !k) { show('Заказ не найден', 'Откройте ссылку со страницы оплаты или напишите нам — поможем.'); return; }
  $('orderNo').textContent = o;
  // ссылка с номером заказа остаётся в адресной строке, чтобы её можно было сохранить в закладки
  if (!params.get('o')) history.replaceState(null, '', '?o=' + encodeURIComponent(o) + '&k=' + encodeURIComponent(k));
  const q = 'o=' + encodeURIComponent(o) + '&k=' + encodeURIComponent(k);
  let tries = 0;

  async function check() {
    tries += 1;
    let data;
    try {
      const r = await fetch('/api/freelancer/order?' + q, { cache: 'no-store' });
      if (r.status === 404) { show('Заказ не найден', 'Проверьте ссылку или напишите нам — поможем.'); return; }
      data = await r.json();
    } catch (e) { data = { status: 'unknown' }; }

    if (data.download) {
      show('Оплата прошла. Спасибо!', 'Комплект готов к скачиванию.');
      try { if (window.siteGoal && !localStorage.getItem('fl_paid_' + o)) { window.siteGoal('purchase'); localStorage.setItem('fl_paid_' + o, '1'); } } catch (e) { /* без хранилища цель не шлём */ }
      $('downloadLink').href = '/api/freelancer/download?' + q;
      $('left').textContent = 'Осталось скачиваний: ' + data.downloads_left + '. Ссылка действует ' + data.days + ' дней с момента оплаты.';
      $('ready').hidden = false; $('payAgain').hidden = true;
      return;
    }
    if (data.paid && data.test) { show('Тестовая оплата прошла', 'Это тестовый платёж: комплект по нему не выдаётся.'); return; }
    if (data.paid) { show('Оплата прошла', 'Срок или лимит скачиваний по этой ссылке закончился — напишите нам, пришлём новую.'); return; }
    if (data.status === 'canceled') { show('Оплата не прошла', 'Деньги не списаны. Можно попробовать ещё раз со страницы комплекта.'); return; }
    if (data.status === 'mismatch') { show('Нужна проверка', 'Платёж требует ручной проверки. Напишите нам с номером заказа.'); return; }
    if (data.pay_url) { $('payLink').href = data.pay_url; $('payAgain').hidden = false; }
    if (tries < 40) {
      show('Проверяем оплату…', 'Обычно это занимает несколько секунд. Не закрывайте страницу.');
      setTimeout(check, tries < 10 ? 3000 : 6000);
    } else {
      show('Оплата пока не подтверждена', 'Если вы уже оплатили, обновите страницу через пару минут. Если нет — нажмите «Вернуться к оплате».');
    }
  }
  check();
})();
