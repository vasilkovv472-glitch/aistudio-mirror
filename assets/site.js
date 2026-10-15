/* Общие скрипты сайта студии: меню, верхняя панель на тёмных этажах, появление блоков, этаж-заставка, окно чата. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // анимации включаются, только если загрузились и GSAP, и ScrollTrigger: иначе блоки сразу видимы, а формы и чат работают
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGsap && !reduce) doc.classList.add('js');

  /* ---------- menu ---------- */
  var menu = document.getElementById('menu');
  var openBtn = document.getElementById('menuOpen');
  if (menu && openBtn) {
    var closeBtn = menu.querySelector('.menu-x');
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.classList.toggle('menu-lock', open);
      document.body.style.overflow = open ? 'hidden' : '';
      Array.prototype.forEach.call(document.body.children, function (el) {
        if (el !== menu && el.tagName !== 'SCRIPT') { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
      });
      if (open) closeBtn.focus(); else openBtn.focus({ preventScroll: true });
    };
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = menu.querySelectorAll('a, button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    openBtn.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  }

  /* ---------- top bar: switches to dark mode over dark floors (live rect check on every scroll) ---------- */
  var bar = document.querySelector('.topbar');
  if (bar) {
    var darks = Array.prototype.slice.call(document.querySelectorAll('.dark, .cta'));
    // dark cards on light floors: each bar item (menu, brand, button) turns light only when a card is right under it
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ck-card, .plan-agent, .plan.pop, .s3-free'));
    var items = Array.prototype.slice.call(bar.querySelectorAll('.hb, .top-brand, .top-cta'));
    var paint = function () {
      var y = 44, band = bar.offsetHeight + 34, onDark = false, edge = false;
      darks.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) onDark = true;
        if ((r.top > 0 && r.top < band) || (r.bottom > 0 && r.bottom < band)) edge = true;
      });
      var rects = onDark ? [] : cards.map(function (el) { return el.getBoundingClientRect(); });
      items.forEach(function (it) {
        var ir = it.getBoundingClientRect(), x = ir.left + ir.width / 2, iy = ir.top + ir.height / 2;
        it.classList.toggle('lt', rects.some(function (r) { return r.top <= iy && r.bottom >= iy && r.left <= x && r.right >= x; }));
      });
      bar.classList.toggle('on-dark', onDark);
      bar.classList.toggle('fade-off', edge);
    };
    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  /* ---------- reveal + intro cards ---------- */
  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.rv').forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    var intro = document.querySelector('.intro');
    if (intro) {
      gsap.utils.toArray('.intro .fly').forEach(function (el) {
        var dx = parseFloat(el.dataset.dx || 0), dy = parseFloat(el.dataset.dy || -120);
        gsap.to(el, { x: dx, y: dy, opacity: .15, ease: 'none',
          scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: .6 } });
      });
      if (intro.querySelector('.mark')) {
        gsap.to('.intro .mark', { yPercent: -18, opacity: .2, ease: 'none',
          scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: .6 } });
        gsap.from('.intro .mark .w', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: .08 });
      }
      if (intro.querySelector('.fly')) {
        gsap.from('.intro .fly', { opacity: 0, scale: .94, duration: 1.1, ease: 'power3.out', stagger: .09, delay: .25 });
      }
      var introBg = intro.querySelector('.intro-bg');
      if (introBg) {
        gsap.fromTo(introBg, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: 'power2.out' });
        // no scroll parallax: with scrub it lagged behind the scroll and made floors 1-2 jump
      }
    }
  }

  /* ---------- spotlight: light follows the cursor over cards ---------- */
  document.querySelectorAll('.svc, .pr, .chat').forEach(function (c) {
    if (c.classList.contains('chat')) return;
    c.classList.add('spot');
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- «Для кого»: endless running lines, pushed by scroll speed; row B runs the other way ---------- */
  var who = document.querySelector('.who');
  if (who && hasGsap && !reduce) {
    var rows = Array.prototype.map.call(who.querySelectorAll('.row'), function (r, i) {
      return { el: r.querySelector('.track'), set: r.querySelector('.set'), x: 0, dir: i ? 1 : -1, base: i ? 38 : 55 };
    });
    var boost = 0, hover = 1, rowA = who.querySelector('.row-a');
    ScrollTrigger.create({ trigger: who, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) { boost = Math.min(6, Math.abs(self.getVelocity()) / 300); } });
    rowA.addEventListener('mouseenter', function () { hover = .25; });
    rowA.addEventListener('mouseleave', function () { hover = 1; });
    gsap.ticker.add(function (t, dt) {
      boost *= .93;
      rows.forEach(function (r, i) {
        var w = r.set.offsetWidth; if (!w) return;
        r.x += r.dir * r.base * (1 + boost) * (i ? 1 : hover) * dt / 1000;
        if (r.x <= -w) r.x += w; if (r.x > 0) r.x -= w;
        r.el.style.transform = 'translate3d(' + r.x.toFixed(2) + 'px,0,0)';
      });
    });
    gsap.timeline({ scrollTrigger: { trigger: who, start: 'top 75%', once: true } })
      .to('.who-top', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
      .to('.who-bot', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, .15);
  } else if (who) {
    who.querySelectorAll('.who-line').forEach(function (l) { l.style.transform = 'none'; });
  }

  /* ---------- big headings: each line rises out of its own mask ---------- */
  if (hasGsap && !reduce && window.SplitText) {
    gsap.registerPlugin(SplitText);
    var heads = document.querySelectorAll('.page-hero h1, .offer h2, .big-h, .sec-head h2, .split h2, .sf-ask h2');
    var splitAll = function () {
      heads.forEach(function (h) {
        h.classList.remove('rv'); gsap.set(h, { opacity: 1, y: 0 });
        SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'split-line-in', autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: .09,
              scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
          } });
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(splitAll); else splitAll();
  }

  /* ---------- dark footer: lines draw once, giant name falls in letter by letter, the form sends a real lead ---------- */
  var foot = document.querySelector('.site-foot');
  if (foot && foot.querySelector('.sf-name')) {
    var name = foot.querySelector('.sf-name');
    var txt = name.textContent; name.textContent = '';
    Array.prototype.forEach.call(txt, function (c) {
      var sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = c === ' ' ? ' ' : c; name.appendChild(sp);
    });
    var fit = function () {
      name.style.fontSize = '100px';
      var cs = name.querySelectorAll('.ch'), w = cs[cs.length - 1].getBoundingClientRect().right - cs[0].getBoundingClientRect().left;
      name.style.fontSize = (100 * name.clientWidth / w * .99).toFixed(2) + 'px';
    };
    var finLine = foot.querySelector('.sf-final > .sf-lv');
    var sizeFin = function () { if (finLine) finLine.style.height = Math.max(0, name.offsetTop - 20) + 'px'; };
    var layout = function () { fit(); sizeFin(); if (hasGsap) ScrollTrigger.refresh(); };
    fit(); sizeFin(); window.addEventListener('resize', function () { fit(); sizeFin(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    if (hasGsap && !reduce) {
      // progress only moves forward: a drawn line is never retracted
      var drawOnce = function (l, prop, st) {
        var p = 0, set = {}; set[prop] = 0; gsap.set(l, set);
        ScrollTrigger.create(Object.assign({}, st, { onUpdate: function (self) {
          if (self.progress <= p) return;
          p = self.progress; var to = { duration: .5, ease: 'power2.out', overwrite: true }; to[prop] = p;
          gsap.to(l, to);
          if (p >= 1) self.kill();
        } }));
      };
      foot.querySelectorAll('.sf-ln').forEach(function (l, i) {
        l.style.transformOrigin = i % 2 ? 'right center' : 'left center';
        drawOnce(l, 'scaleX', { trigger: l, start: 'top 96%', end: 'top 62%' });
      });
      foot.querySelectorAll('.sf-lv').forEach(function (l) {
        drawOnce(l, 'scaleY', { trigger: l.parentElement, start: 'top 85%', end: l.closest('.sf-final') ? 'bottom bottom' : 'bottom 85%' });
      });
      var chars = name.querySelectorAll('.ch');
      gsap.set(chars, { yPercent: -105 });
      ScrollTrigger.create({ trigger: name, start: 'center bottom', once: true, onEnter: function () {
        gsap.to(chars, { yPercent: 0, duration: 1.1, ease: 'power2.out', stagger: { amount: .35, ease: 'power4.inOut' } });
      } });
      gsap.from(foot.querySelectorAll('.sf-tag, .sf-nav'), { opacity: 0, y: 20, duration: 1, ease: 'power3.out', stagger: .1,
        scrollTrigger: { trigger: '.sf-final', start: 'top 85%' } });
    }

    var leadBox = foot.querySelector('.sf-form'), leadForm = leadBox.querySelector('form'), leadErr = leadForm.querySelector('.sf-err');
    var pick = leadForm.querySelector('.sf-pick'), pickVal = pick && pick.querySelector('b');
    // кнопки тарифов передают выбранную услугу в заявку
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="#contact"]');
      if (!a || !pick) return;
      var card = a.closest('.plan, .plan-agent'), name = '';
      if (card) {
        var h = card.querySelector('h3'), k = card.querySelector('.kind'), pr = card.querySelector('.price b');
        var v = pr && (pr.dataset.v ? Number(pr.dataset.v).toLocaleString('ru-RU') : pr.textContent.trim());
        name = ([k && k.textContent.trim(), h && h.textContent.trim()].filter(Boolean).join(' — ') + (v ? ', ' + v + ' ₽' : '')).replace(/\s+/g, ' ');
      }
      leadForm.elements.service.value = name;
      pickVal.textContent = name;
      pick.hidden = !name;
    });
    var leadPending = false;
    var FIELD_ERR = { name: 'Укажите имя.', phone: 'Проверьте номер телефона.', consent: 'Без согласия на обработку данных мы не можем принять заявку.' };
    var MAYBE_SENT = 'Сервер не ответил вовремя — заявка могла дойти. Чтобы не было дубля, прежде чем отправлять ещё раз, напишите нам в Telegram или MAX.';
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (leadPending) return;                         // повторное нажатие во время отправки не создаёт дубль
      var f = leadForm.elements, bad = [];
      leadForm.querySelectorAll('.bad').forEach(function (el) { el.classList.remove('bad'); });
      var digits = f.phone.value.replace(/\D/g, '');
      if (!(digits.length === 10 || (digits.length === 11 && /^[78]/.test(digits)))) bad.push(f.phone);
      if (!f.name.value.trim()) bad.push(f.name);
      if (!f.consent.checked) bad.push(f.consent);
      if (bad.length) {
        bad.forEach(function (el) { el.closest('.sf-f, .sf-consent').classList.add('bad'); });
        leadErr.textContent = f.consent.checked ? 'Проверьте телефон и имя.' : FIELD_ERR.consent;
        bad[0].focus(); return;
      }
      leadErr.textContent = '';
      leadPending = true;
      leadBox.classList.add('wait');
      var started = Date.now();
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var finished = false, timer, guard;
      // освобождает форму ровно один раз — при любом исходе: ответ, ошибка сети, сбой чтения тела, таймаут
      var finish = function (res) {
        if (finished) return;
        finished = true; clearTimeout(timer); clearTimeout(guard);
        var sent = false, msg = MAYBE_SENT;
        try {
          sent = !!(res.ok && res.data && res.data.ok === true);
          if (sent) msg = '';
          else if (res.status === 0) msg = MAYBE_SENT;   // сеть, таймаут или оборванный ответ: исход неизвестен
          else if (res.status === 429) msg = 'Слишком много заявок с этого адреса. Напишите нам в Telegram или MAX.';
          else if (res.status === 400 && res.data && Array.isArray(res.data.errors)) {
            res.data.errors.forEach(function (k) { var el = f[k]; if (el && el.closest) el.closest('.sf-f, .sf-consent').classList.add('bad'); });
            msg = res.data.errors.map(function (k) { return FIELD_ERR[k] || ''; }).filter(Boolean).join(' ') || 'Проверьте поля формы.';
          }
          else if (res.ok) msg = 'Сервер ответил непонятно — заявка могла дойти. Прежде чем отправлять снова, напишите нам в Telegram или MAX.';
          else msg = 'Сервер ответил ошибкой (' + res.status + '), заявка не подтверждена. Попробуйте позже или напишите нам в Telegram или MAX.';
        } catch (err) { sent = false; msg = MAYBE_SENT; }
        setTimeout(function () {
          leadPending = false;
          leadBox.classList.remove('wait');
          if (sent) { leadBox.classList.add('sent'); leadForm.reset(); if (pick) pick.hidden = true; if (window.siteGoal) window.siteGoal('lead_sent'); }
          else leadErr.textContent = msg;              // поля остаются заполненными
          if (hasGsap) ScrollTrigger.refresh();
        }, Math.max(0, 900 - (Date.now() - started)));
      };
      timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
      guard = setTimeout(function () { finish({ status: 0 }); }, 21000);   // даже если отмена не сработала
      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl ? ctrl.signal : undefined,
        body: JSON.stringify({ phone: f.phone.value, name: f.name.value, message: f.message.value, service: f.service.value,
          consent: f.consent.checked, website: f.website.value }) })
        .then(function (r) {
          return r.text().then(function (txt) {
            var d = null; try { d = JSON.parse(txt); } catch (err) { /* не JSON */ }
            return { status: r.status, ok: r.ok, data: d };
          });
        })
        .catch(function () { return { status: 0 }; })   // ловит и отказ fetch, и сбой/отмену чтения тела
        .then(finish, function () { finish({ status: 0 }); });
    });
  }

  /* ---------- price plans: service switch with a sliding pill; prices are always shown as is ---------- */
  // \u0446\u0435\u043d\u044b \u043d\u0435 \u00ab\u043d\u0430\u0431\u0435\u0433\u0430\u044e\u0442\u00bb \u0430\u043d\u0438\u043c\u0430\u0446\u0438\u0435\u0439: \u0441\u043d\u0438\u043c\u043e\u043a \u0438\u043b\u0438 \u0447\u0442\u0435\u043d\u0438\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b \u043f\u043e\u0441\u0440\u0435\u0434\u0438 \u0430\u043d\u0438\u043c\u0430\u0446\u0438\u0438 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u043b\u0438 \u0431\u044b \u043d\u0435\u0432\u0435\u0440\u043d\u044b\u0435 \u0441\u0443\u043c\u043c\u044b
  var fmt = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/\s/g, '\u00a0'); };
  var countUp = function (scope) {
    scope.querySelectorAll('.price b[data-v]').forEach(function (b) { b.textContent = fmt(+b.dataset.v); });
  };
  document.querySelectorAll('#prices').forEach(function (sec) {
    var bill = sec.querySelector('.bill'); if (!bill) return;
    var btns = Array.prototype.slice.call(bill.querySelectorAll('button')), pill = bill.querySelector('i');
    var move = function (b) { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; };
    var select = function (b) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      move(b);
      sec.querySelectorAll('.plans[data-set]').forEach(function (p) {
        var on = p.dataset.set === b.dataset.set;
        p.hidden = !on;
        if (on) {
          if (hasGsap && !reduce) gsap.fromTo(p.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', stagger: .07 });
          countUp(p);
        }
      });
      if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { if (b.getAttribute('aria-pressed') !== 'true') select(b); }); });
    move(btns[0]);
    window.addEventListener('resize', function () { move(btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0]); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { move(btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0]); });
  });

  /* ---------- principles: glow follows the cursor, gentle magnetic tilt, other cards dim ---------- */
  document.querySelectorAll('[data-spot]').forEach(function (grid) {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    grid.querySelectorAll('.spot-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        if (fine && !reduce) {
          card.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
        }
      });
      card.addEventListener('pointerenter', function () { grid.classList.add('has-focus'); });
      card.addEventListener('pointerleave', function () {
        grid.classList.remove('has-focus');
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  });

  /* ---------- chat window ---------- */
  var chat = document.querySelector('[data-chat]');
  if (!chat) return;
  var log = chat.querySelector('.chat-log'), typing = chat.querySelector('.chat-typing');
  var form = chat.querySelector('.chat-form'), input = form.querySelector('input');
  var sid;
  try { sid = localStorage.getItem('bot_sid'); } catch (e) {}
  if (!sid || !/^[A-Za-z0-9_-]{16,64}$/.test(sid)) {
    var a = new Uint8Array(18); crypto.getRandomValues(a);
    sid = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    try { localStorage.setItem('bot_sid', sid); } catch (e) {}
  }

  // Текст — через textContent, ссылки — отдельными узлами (без innerHTML)
  function linkify(el, text) {
    var re = /https?:\/\/[^\s]+/g, last = 0, m;
    while ((m = re.exec(text))) {
      el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var l = document.createElement('a'); l.href = m[0]; l.textContent = m[0];
      l.target = '_blank'; l.rel = 'noopener noreferrer'; el.appendChild(l);
      last = m.index + m[0].length;
    }
    el.appendChild(document.createTextNode(text.slice(last)));
  }
  function scrollDown() { log.scrollTop = log.scrollHeight; }
  function add(cls, text, label) {
    var d = document.createElement('div'); d.className = 'msg ' + cls;
    if (label) { var l = document.createElement('span'); l.className = 'msg-label'; l.textContent = label; d.appendChild(l); }
    if (/\bbot\b/.test(cls)) linkify(d, text); else d.appendChild(document.createTextNode(text));
    log.appendChild(d); scrollDown();
  }
  function disableOld() { log.querySelectorAll('button.cbtn').forEach(function (b) { b.disabled = true; }); }
  // late — результат задачи, которая уже не относится к текущему сценарию: показываем отдельной карточкой
  function render(replies, late) {
    replies.forEach(function (r) {
      add(late ? 'bot late' : 'bot', r.text, late ? 'Результат ранее запрошенной проверки' : '');
      if (!r.buttons.length) return;
      var box = document.createElement('div'); box.className = late ? 'btns late' : 'btns';
      r.buttons.forEach(function (row) {
        var rowEl = document.createElement('div'); rowEl.className = 'btn-row';
        row.forEach(function (b) {
          var el;
          if (b.url) {
            el = document.createElement('a'); el.href = b.url; el.target = '_blank'; el.rel = 'noopener noreferrer';
          } else {
            el = document.createElement('button'); el.type = 'button';
            el.setAttribute('data-payload', b.payload);
            el.addEventListener('click', function () { send({ payload: b.payload }, b.label); });
          }
          el.className = 'cbtn'; el.textContent = b.label; rowEl.appendChild(el);
        });
        box.appendChild(rowEl);
      });
      log.appendChild(box);
    });
    scrollDown();
  }
  var busy = false, button = form.querySelector('button');
  // Сценарии чата: 'chat' — обычный диалог (демо-запись и меню), 'check' — проверка сайта.
  // shown — сценарий, который уже отправлен и показан в заголовке; wanted — выбор, ждущий освобождения чата.
  // gen растёт при каждой смене сценария: ответ, пришедший для прежнего сценария, не трогает новый.
  var started = false, shown = 'chat', wanted = null, gen = 0;
  var scanTask = null;   // проверка сайта, запущенная в текущем сценарии (scan:<id> с сервера)
  var liveH = document.getElementById('live-h'), liveLead = liveH && liveH.parentElement.querySelector('.lead');
  var texts = {
    chat: liveH ? [liveH.innerHTML, liveLead && liveLead.textContent] : null,
    check: ['Проверка сайта <b>по&nbsp;152&#8209;ФЗ</b>.',
      'Пришлите адрес сайта в чат. Секретарь проверит до 7 страниц и объяснит каждую найденную проблему. Это автоматическая техническая проверка, а не юридическое заключение.']
  };
  function paintMode(mode) {
    chat.setAttribute('data-mode', mode);
    if (liveH && texts[mode]) { liveH.innerHTML = texts[mode][0]; if (liveLead && texts[mode][1]) liveLead.textContent = texts[mode][1]; }
  }
  function setBusy(on) {
    busy = on;
    input.disabled = on; button.disabled = on;
    chat.classList.toggle('is-typing', on);
    typing.textContent = on ? 'Секретарь печатает' : '';
  }
  // false — сообщение не принято (чат ещё ждёт ответ); введённый текст тогда остаётся в поле
  function send(body, label) {
    if (busy) return false;
    var myGen = gen;
    setBusy(true); disableOld(); wakePoll();
    started = true;
    if (label) add('me', label);
    body.sid = sid;
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        if (!data || !Array.isArray(data.replies)) throw new Error('bad reply');
        if (myGen !== gen) return;
        data.replies.forEach(function (r) {
          if (r.task && shown === 'check') scanTask = r.task;
          if (r.task && r.task.indexOf('scan:') === 0 && window.siteGoal) window.siteGoal('scan_start');
        });
        render(data.replies);
      })
      .catch(function () { if (myGen === gen) add('bot', 'Нет связи с ботом. Попробуйте ещё раз через минуту.'); })
      .then(function () { clearTimeout(timer); setBusy(false); flush(); });
    return true;
  }
  // Переключение сценария: сразу, если чат свободен, иначе — после текущего ответа (учитывается последний выбор)
  function startScenario(mode) {
    gen++; shown = mode; paintMode(mode); scanTask = null;
    if (mode === 'check') send({ payload: 'scan' }, 'Проверить сайт по 152-ФЗ');
    else send({ payload: started ? 'menu' : 'start' });
  }
  function want(mode) { wanted = mode; flush(); }
  function flush() {
    if (busy || !wanted) return;
    var mode = wanted; wanted = null;
    if (started && mode === shown) return;          // уже в этом сценарии — без дублей
    startScenario(mode);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = input.value.trim(); if (!t) return;
    if (send({ text: t }, t)) input.value = '';
  });
  // кнопки внутри чата тоже меняют сценарий в заголовке
  log.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button.cbtn');
    if (!b || b.disabled || busy) return;
    var p = b.getAttribute('data-payload');
    if (p === 'scan') { if (shown !== 'check') { gen++; shown = 'check'; paintMode('check'); } scanTask = null; }
    else if ((p === 'menu' || p === 'start') && shown !== 'chat') { gen++; shown = 'chat'; paintMode('chat'); scanTask = null; }
  }, true);

  // Отложенные ответы (отчёт о проверке сайта): опрос идёт только после начала диалога, запросы не накладываются,
  // каждый ограничен 15 секундами, при ошибках интервал растёт до минуты, через 15 минут тишины опрос засыпает
  var pollTimer = null, pollDelay = 3000, lastActive = 0, polling = false;
  function schedulePoll() { clearTimeout(pollTimer); pollTimer = setTimeout(poll, pollDelay); }
  function wakePoll() { lastActive = Date.now(); pollDelay = 3000; if (!polling) schedulePoll(); }
  function poll() {
    pollTimer = null;
    if (Date.now() - lastActive > 15 * 60 * 1000) return;
    if (document.hidden) { schedulePoll(); return; }
    polling = true;
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch('/api/poll?sid=' + sid, { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        if (!data || !Array.isArray(data.replies)) throw new Error('bad reply');
        pollDelay = 3000;
        // свой отчёт текущей проверки заменяет кнопки диалога; результат прежней задачи — отдельная карточка,
        // текущие кнопки и сценарий не трогает
        var fresh = [], late = [];
        data.replies.forEach(function (r) { (r.task && !(shown === 'check' && r.task === scanTask) ? late : fresh).push(r); });
        if (fresh.length) { if (fresh.some(function (r) { return r.task; })) disableOld(); render(fresh); }
        if (late.length) render(late, true);
      })
      .catch(function () { pollDelay = Math.min(pollDelay * 2, 60000); })
      .then(function () { clearTimeout(timer); polling = false; schedulePoll(); });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && started && !polling) schedulePoll(); });

  // Ссылки и адрес страницы: #check — проверка сайта, #chat — обычный чат; работают «назад» и «вперёд»
  function modeOfHash(h) { return h === '#check' ? 'check' : h === '#chat' ? 'chat' : null; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#check"], a[href="/#check"], a[href="#chat"], a[href="/#chat"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var hash = a.getAttribute('href').replace(/^\//, ''), target = document.getElementById(hash.slice(1));
    e.preventDefault();
    if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: hash === '#check' ? 'center' : 'start' });
    if (location.hash !== hash) history.pushState(null, '', hash);
    want(modeOfHash(hash));
  });
  function onNavigate() {
    if (!started) return;
    var h = location.hash, m = (h === '' || h === '#') ? 'chat' : modeOfHash(h);
    if (m) want(m);
  }
  window.addEventListener('popstate', onNavigate);
  window.addEventListener('hashchange', onNavigate);
  if (location.hash === '#check') paintMode('check');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      if (!started && !wanted) want(modeOfHash(location.hash) || 'chat');
    }, { rootMargin: '400px' });
    io.observe(chat);
  } else want(modeOfHash(location.hash) || 'chat');
})();

/* ---------- live cards (prices, steps, services) + premium FAQ accordion ---------- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  // cursor-following light and a gentle tilt; CSS draws the effect from --mx/--my/--rx/--ry
  document.querySelectorAll('.plan, .step, .s3-card').forEach(function (c) {
    c.classList.add('live');
    if (!fine) return;
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (!reduce && c.classList.contains('plan')) {
        c.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((.5 - y) * 6).toFixed(2) + 'deg');
      }
    });
    c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  // FAQ: smooth open/close instead of the native jump, light that follows the cursor
  document.querySelectorAll('.faq details').forEach(function (d) {
    var s = d.querySelector('summary'), body = d.querySelector('summary ~ *');
    if (!s || !body) return;
    if (fine) d.addEventListener('pointermove', function (e) {
      var r = d.getBoundingClientRect(); d.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    });
    if (reduce || !body.animate) return;
    s.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = '1';
      if (!d.open) {
        d.open = true;
        var h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: h + 'px', opacity: 1, transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = function () { delete d.dataset.busy; };
      } else {
        d.classList.add('closing');
        body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = function () { d.open = false; d.classList.remove('closing'); delete d.dataset.busy; };
      }
    });
  });
})();

/* ---------- /152 stacking cards: a deck — cards underneath recede by depth, their coloured edges stay visible ---------- */
(function () {
  var stack = document.querySelector('.ck-stack');
  if (!stack) return;
  var cards = Array.prototype.slice.call(stack.querySelectorAll('.ck-card'));
  var count = document.querySelector('.ck-count b'), bar = document.querySelector('.ck-bar i');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = function () { return window.matchMedia('(min-width: 1001px)').matches; };
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight, on = wide() && !reduce;
    // how far each card has travelled to its sticky place: 0 — below the screen, 1 — in place
    var t = cards.map(function (c) {
      var stick = parseFloat(getComputedStyle(c).top) || 0;
      var top = c.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, (vh - top) / Math.max(1, vh - stick)));
    });
    var active = 0;
    t.forEach(function (v, i) { if (v > 0.6) active = i; });
    cards.forEach(function (c, i) {
      if (!on) { c.style.transform = ''; c.style.filter = ''; c.classList.remove('is-under'); return; }
      var depth = 0;
      for (var j = i + 1; j < cards.length; j++) depth += t[j];
      var d = Math.min(depth, 6);
      c.style.transform = depth ? 'scale(' + (1 - d * 0.022).toFixed(4) + ')' : '';
      c.style.filter = depth ? 'brightness(' + (1 - Math.min(depth, 3) * 0.12).toFixed(3) + ')' : '';
      c.classList.toggle('is-under', depth > 0.85);
    });
    if (count) count.textContent = active + 1;
    if (bar) bar.style.width = ((active + 1) / cards.length * 100) + '%';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- cookie: Яндекс Метрика подключается только после согласия; цели — заявка, проверка сайта, переход в мессенджер ---------- */
(function () {
  var ID = 113558040, KEY = 'cookie_choice';   // 'yes' | 'no'; без выбора счётчик не грузится
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
    bar.innerHTML = '<p>Включить Яндекс Метрику? Она ставит cookie и обезличенно считает посещения. Сайт работает и без неё. <a href="/privacy">Подробнее</a></p>' +
      '<div class="cc-btns"><button type="button" class="cc-no">Отказаться</button><button type="button" class="cc-yes">Принять</button></div>';
    bar.querySelector('.cc-yes').addEventListener('click', function () { choose('yes'); });
    bar.querySelector('.cc-no').addEventListener('click', function () { choose('no'); });
    document.body.appendChild(bar);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-settings], a[href*="t.me/"], a[href*="max.ru/"]');
    if (!t) return;
    if (t.hasAttribute('data-cookie-settings')) { e.preventDefault(); show(); }
    else window.siteGoal('messenger_click');
  });
  var c = read();
  if (c === 'yes') load(); else if (c !== 'no') show();
})();

/* ---------- премиум: свет под курсором на плитках меню и карточках блога, фильтр рубрик, прогресс чтения ---------- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-glow]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });
  });

  var grid = document.querySelector('[data-bx-grid]');
  var filter = document.querySelector('.bx-filter');
  if (grid && filter) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.bx-card'));
    filter.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-f]');
      if (!b) return;
      filter.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.getAttribute('data-f'), shown = 0;
      cards.forEach(function (c) {
        var on = f === 'all' || c.getAttribute('data-rubric') === f;
        c.hidden = !on;
        c.classList.toggle('bx-feat', on && f === 'all' && c === cards[0]);
        if (on && !reduce) {
          c.classList.add('bx-wait');
          setTimeout(function () { c.classList.remove('bx-wait'); }, 40 + 45 * shown++);
        }
      });
    });
  }

  // карточки появляются по очереди, когда доходят до экрана
  var boxes = document.querySelectorAll('.bx-card');
  if (boxes.length && 'IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      var i = 0;
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var c = en.target;
        setTimeout(function () { c.classList.remove('bx-wait'); }, 70 * i++);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    boxes.forEach(function (c) { c.classList.add('bx-wait'); io.observe(c); });
  }

  var bar = document.querySelector('.art-progress i'), paper = document.querySelector('.art-paper');
  if (bar && paper) {
    var tick = false;
    var upd = function () {
      tick = false;
      var r = paper.getBoundingClientRect(), total = r.height - window.innerHeight * 0.6;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.style.width = (p * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
})();
