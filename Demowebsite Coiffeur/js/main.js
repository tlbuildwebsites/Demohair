/* Demohair – Interaktionen (ohne Abhängigkeiten) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Öffnungszeiten (eine Quelle für alle Seiten) ---------- */
  // Index = Date.getDay(): 0 = Sonntag
  var HOURS = [
    null,                       // So
    null,                       // Mo
    ['08:30', '18:30'],         // Di
    ['08:30', '18:30'],         // Mi
    ['08:30', '20:00'],         // Do
    ['08:30', '18:30'],         // Fr
    ['08:00', '15:00']          // Sa
  ];
  var DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }

  function openingStatus(now) {
    var d = now.getDay(), m = now.getHours() * 60 + now.getMinutes(), h = HOURS[d];
    if (h && m >= toMin(h[0]) && m < toMin(h[1])) return { open: true, text: 'Jetzt geöffnet · bis ' + h[1] + ' Uhr' };
    if (h && m < toMin(h[0])) return { open: false, text: 'Geschlossen · öffnet heute um ' + h[0] + ' Uhr' };
    for (var i = 1; i <= 7; i++) {
      var nd = (d + i) % 7;
      if (HOURS[nd]) {
        var when = i === 1 ? 'morgen' : 'am ' + DAY_NAMES[nd];
        return { open: false, text: 'Geschlossen · öffnet ' + when + ' um ' + HOURS[nd][0] + ' Uhr' };
      }
    }
    return { open: false, text: 'Geschlossen' };
  }

  function renderStatus() {
    var now = new Date(), s = openingStatus(now);
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      var t = el.querySelector('.status__text');
      if (t) t.textContent = s.text;
    });
    document.querySelectorAll('.hours li[data-day]').forEach(function (li) {
      li.classList.toggle('is-today', +li.getAttribute('data-day') === now.getDay());
    });
  }

  /* ---------- Sanftes Einblenden (einmalig) ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Header & mobiles Menü ---------- */
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header) return;
    var ticking = false;
    function update() { header.classList.toggle('is-scrolled', window.scrollY > 10); ticking = false; }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    var toggle = document.querySelector('.nav-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var open = root.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('nav-open')) toggle.click();
    });
  }

  /* ---------- Galerie: Filter & Lightbox ---------- */
  function initGallery() {
    var gallery = document.querySelector('.masonry[data-gallery]');
    var lb = document.querySelector('.lightbox');
    if (!gallery || !lb) return;

    var img = lb.querySelector('.lightbox__img');
    var cap = lb.querySelector('.lightbox__cap');
    var count = lb.querySelector('.lightbox__count');
    var current = 0, list = [], lastFocus = null;

    function visibleItems() {
      return Array.prototype.filter.call(gallery.querySelectorAll('.g-item'), function (b) {
        return !b.closest('.g-wrap').classList.contains('is-hidden');
      });
    }
    function show(i) {
      current = (i + list.length) % list.length;
      var item = list[current];
      img.src = item.getAttribute('data-full');
      img.alt = item.querySelector('img').alt;
      cap.innerHTML = '<b>' + item.getAttribute('data-title') + '</b>' + item.getAttribute('data-text');
      count.textContent = (current + 1) + ' / ' + list.length;
    }
    function open(btn) {
      list = visibleItems();
      lastFocus = btn;
      show(list.indexOf(btn));
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lightbox__close').focus();
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    gallery.addEventListener('click', function (e) {
      var btn = e.target.closest('.g-item');
      if (btn) open(btn);
    });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      sx = null;
    });

    document.querySelectorAll('[data-filter]').forEach(function (f) {
      f.addEventListener('click', function () {
        document.querySelectorAll('[data-filter]').forEach(function (x) {
          x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false');
        });
        f.classList.add('is-active');
        f.setAttribute('aria-pressed', 'true');
        var cat = f.getAttribute('data-filter');
        gallery.querySelectorAll('.g-wrap').forEach(function (w) {
          var match = cat === 'alle' || (w.getAttribute('data-cat') || '').split(' ').indexOf(cat) > -1;
          w.classList.toggle('is-hidden', !match);
          if (match) w.classList.add('is-in');
        });
      });
    });
  }

  /* ---------- Kontaktformular (Demo) ---------- */
  function initContactForm() {
    var form = document.querySelector('#kontaktformular');
    if (!form) return;
    var ok = document.querySelector('.form-success');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var name = form.querySelector('[name="vorname"]').value.trim();
      ok.querySelector('[data-name]').textContent = name ? ', ' + name : '';
      form.classList.add('is-hidden');
      ok.classList.add('is-visible');
      ok.setAttribute('tabindex', '-1');
      ok.focus();
    });
    document.querySelector('[data-form-reset]').addEventListener('click', function () {
      form.reset();
      form.classList.remove('is-hidden');
      ok.classList.remove('is-visible');
    });
  }

  /* ---------- Buchungs-Demo ---------- */
  function initBooking() {
    var app = document.querySelector('#booking');
    if (!app) return;
    var state = { service: null, price: null, person: null, day: null, dayLabel: null, time: null };
    var daysEl = app.querySelector('.days'), slotsEl = app.querySelector('.slots');
    var cta = document.querySelector('#bk-confirm');
    var MONTHS = ['Jan.', 'Feb.', 'März', 'April', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
    var SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    function selectIn(container, el) {
      container.querySelectorAll('.is-selected').forEach(function (x) { x.classList.remove('is-selected'); x.setAttribute('aria-pressed', 'false'); });
      el.classList.add('is-selected');
      el.setAttribute('aria-pressed', 'true');
    }
    function update() {
      function set(k, v) { document.querySelector('[data-sum="' + k + '"]').textContent = v || '–'; }
      set('service', state.service ? state.service + ' · ' + state.price : null);
      set('person', state.person);
      set('date', state.dayLabel ? state.dayLabel + (state.time ? ', ' + state.time + ' Uhr' : '') : null);
      cta.disabled = !(state.service && state.person && state.day && state.time);
    }

    app.querySelectorAll('[data-service]').forEach(function (b) {
      b.addEventListener('click', function () {
        selectIn(b.parentNode, b);
        state.service = b.getAttribute('data-service'); state.price = b.getAttribute('data-price'); update();
      });
    });
    app.querySelectorAll('[data-person]').forEach(function (b) {
      b.addEventListener('click', function () { selectIn(b.parentNode, b); state.person = b.getAttribute('data-person'); update(); });
    });

    function renderSlots(date) {
      var h = HOURS[date.getDay()], start = toMin(h[0]), end = toMin(h[1]) - 60;
      var seed = date.getDate() * 7 + date.getMonth();
      slotsEl.innerHTML = '';
      for (var m = start, k = 0; m <= end; m += 30, k++) {
        var t = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'slot'; b.textContent = t;
        if ((seed + k * 3) % 5 === 0 || (seed + k) % 7 === 0) { b.disabled = true; b.title = 'Bereits gebucht'; }
        b.addEventListener('click', (function (t, b) {
          return function () { selectIn(slotsEl, b); state.time = t; update(); };
        })(t, b));
        slotsEl.appendChild(b);
      }
    }

    var d = new Date(); d.setHours(12, 0, 0, 0);
    for (var added = 0; added < 6;) {
      d.setDate(d.getDate() + 1);
      if (!HOURS[d.getDay()]) continue;
      var date = new Date(d), b = document.createElement('button');
      b.type = 'button'; b.className = 'day';
      b.innerHTML = '<small>' + SHORT[date.getDay()] + '</small><b>' + date.getDate() + '</b><small>' + MONTHS[date.getMonth()] + '</small>';
      b.addEventListener('click', (function (date, b) {
        return function () {
          selectIn(daysEl, b);
          state.day = date; state.time = null;
          state.dayLabel = DAY_NAMES[date.getDay()] + ', ' + date.getDate() + '. ' + MONTHS[date.getMonth()];
          renderSlots(date); update();
        };
      })(date, b));
      daysEl.appendChild(b);
      added++;
    }

    cta.addEventListener('click', function () {
      if (cta.disabled) return;
      var c = document.querySelector('.confirm');
      c.querySelector('[data-c="service"]').textContent = state.service + ' (' + state.price + ')';
      c.querySelector('[data-c="person"]').textContent = state.person;
      c.querySelector('[data-c="date"]').textContent = state.dayLabel;
      c.querySelector('[data-c="time"]').textContent = state.time + ' Uhr';
      document.querySelector('.booking').style.display = 'none';
      c.classList.add('is-visible');
      window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 120);
    });
    document.querySelector('[data-booking-reset]').addEventListener('click', function () { location.reload(); });
    update();
  }

  /* ---------- Start ---------- */
  renderStatus();
  setInterval(renderStatus, 60000);
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  initHeader();
  initGallery();
  initContactForm();
  initBooking();
  initReveal();
})();
