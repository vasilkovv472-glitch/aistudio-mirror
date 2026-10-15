// Зеркало страниц на GitHub Pages — для сетей, где сервер студии недоступен (например, мобильный Билайн).
// Если основной сайт открывается — сразу уводим туда: там работают формы, чат и оплата.
// Если нет — остаёмся здесь, а всё, что требует сервера, ведём в Telegram.
(function () {
  var MAIN = 'https://aistudiodimkoff.ru';
  var TG = 'https://t.me/DimkoFFSecretarybot';
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!nativeFetch) return;

  // Сервера здесь нет: запросы к /api/ сразу завершаем ошибкой, чтобы страница не ждала.
  window.fetch = function (url, opts) {
    if (typeof url === 'string' && url.indexOf('/api/') === 0) {
      return Promise.reject(new Error('Сейчас это работает через Telegram'));
    }
    return nativeFetch(url, opts);
  };

  var ctrl = window.AbortController ? new AbortController() : null;
  if (ctrl) setTimeout(function () { ctrl.abort(); }, 4000);
  nativeFetch(MAIN + '/favicon.ico?mirror=' + Date.now(), { mode: 'no-cors', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
    .then(function () { location.replace(MAIN + location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') + location.search + location.hash); })
    .catch(function () { document.documentElement.classList.add('mirror-only'); });

  function tg(a) { a.href = TG; a.target = '_blank'; a.rel = 'noopener'; }

  document.addEventListener('DOMContentLoaded', function () {
    // Ссылки на основной домен ведём внутрь зеркала (кроме оплаты — её здесь нет)
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var h = a.getAttribute('href');
      if (h.indexOf(MAIN) === 0) { h = h.slice(MAIN.length) || '/'; a.setAttribute('href', h); }
      if (/^\/pay(\?|$)/.test(h) || h.indexOf('https://pay.aistudiodimkoff.ru') === 0) tg(a);
    });

    // Покупка комплекта фрилансера — через Telegram
    var buy = document.querySelector('#checkoutButton');
    if (buy) {
      var link = document.createElement('a');
      link.className = buy.className;
      link.textContent = 'Купить через Telegram';
      tg(link);
      buy.parentNode.replaceChild(link, buy);
      var form = document.querySelector('#buyForm');
      if (form) form.hidden = true;
      setTimeout(function () {
        var st = document.querySelector('#checkoutStatus');
        if (st) st.textContent = 'Напишите в Telegram — пришлём ссылку на оплату и ответим на вопросы.';
      }, 50);
    }

    // Формы заявки — подсказываем Telegram
    Array.prototype.forEach.call(document.querySelectorAll('form'), function (f) {
      if (f.id === 'buyForm' || f.querySelector('.mirror-note')) return;
      var note = document.createElement('p');
      note.className = 'mirror-note';
      note.style.cssText = 'margin:8px 0 0;font-size:14px';
      note.innerHTML = 'Если форма не отправляется — <a href="' + TG + '" target="_blank" rel="noopener">напишите нам в Telegram</a>.';
      f.appendChild(note);
    });
  });
})();
