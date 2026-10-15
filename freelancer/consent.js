// Cookie и Яндекс Метрика — как на aistudiodimkoff.ru: счётчик подключается только после «Принять».
// Выбор хранится под тем же ключом, что и на основном сайте (один домен), поэтому второй раз не спрашиваем.
// Цели: demo_open — переход в демо, buy_click — нажатие «Купить» с заполненной формой, purchase — оплата прошла,
// messenger_click — переход в Telegram или MAX.
(function () {
  var ID = 113558040, KEY = 'cookie_choice';   // 'yes' | 'no'
  var loaded = false, bar = null;
  window.siteGoal = function (name) { try { if (loaded && window.ym) window.ym(ID, 'reachGoal', name); } catch (e) {} };
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() {
    if (loaded) return;
    loaded = true;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = 1 * new Date();
    var s = document.createElement('script');
    s.async = true; s.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(s);
    window.ym(ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
  function hide() { if (bar) { bar.remove(); bar = null; } }
  function choose(v) {
    var was = read();
    save(v); hide();
    if (v === 'yes') load();
    else if (was === 'yes' && loaded) location.reload();   // отказ после согласия: перезагрузка выгружает счётчик
  }
  function show() {
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'cc-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie');
    bar.innerHTML = '<p>Включить Яндекс Метрику? Она ставит cookie и обезличенно считает посещения. Страница работает и без неё. <a href="/privacy">Подробнее</a></p>' +
      '<div class="cc-btns"><button type="button" class="cc-no">Отказаться</button><button type="button" class="cc-yes">Принять</button></div>';
    bar.querySelector('.cc-yes').addEventListener('click', function () { choose('yes'); });
    bar.querySelector('.cc-no').addEventListener('click', function () { choose('no'); });
    document.body.appendChild(bar);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-settings], a[href*="assistant.html"], a[href*="t.me/"], a[href*="max.ru/"]');
    if (!t) return;
    if (t.hasAttribute('data-cookie-settings')) { e.preventDefault(); show(); }
    else if ((t.getAttribute('href') || '').indexOf('assistant.html') !== -1) window.siteGoal('demo_open');
    else window.siteGoal('messenger_click');
  });
  var c = read();
  if (c === 'yes') load(); else if (c !== 'no') show();
})();
