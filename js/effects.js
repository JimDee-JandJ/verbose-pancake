(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fineCursor = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Scroll progress bar ---------- */
  (function scrollProgress() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var scrollable = h.scrollHeight - h.clientHeight;
      var pct = scrollable > 0 ? Math.min(1, h.scrollTop / scrollable) : 0;
      bar.style.transform = 'scaleX(' + pct + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ---------- Number count-up ---------- */
  (function countUp() {
    var els = document.querySelectorAll('.count-up');
    if (!els.length) return;
    if (reduceMotion) return; // final values are already in the markup

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-value'));
      if (isNaN(target)) return;
      var decimals = (el.getAttribute('data-value').split('.')[1] || '').length;
      var duration = 1100;
      var start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        var val = target * eased;
        el.textContent = val.toLocaleString('en-GB', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Magnetic hover ---------- */
  (function magnetic() {
    if (reduceMotion || !fineCursor) return;
    var els = document.querySelectorAll('.magnetic');
    els.forEach(function (el) {
      var strength = 0.35;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  })();

  /* ---------- Cursor spotlight on dark panels ---------- */
  (function spotlight() {
    if (reduceMotion || !fineCursor) return;
    var zones = document.querySelectorAll('.spotlight-zone');
    if (!zones.length) return;
    zones.forEach(function (zone) {
      zone.addEventListener('mousemove', function (e) {
        var r = zone.getBoundingClientRect();
        zone.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%');
        zone.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  })();

  /* ---------- Parallax drift on hero photos ---------- */
  (function parallax() {
    if (reduceMotion) return;
    var els = Array.prototype.slice.call(document.querySelectorAll('.hero-photo, .divider-bg'));
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var progress = (r.top / vh) - 0.5;
        el.style.backgroundPosition = 'center ' + (50 + progress * 12) + '%';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ---------- Staggered grid reveal ---------- */
  (function gridReveal() {
    var grids = document.querySelectorAll('.spec-grid, .occupiers-grid');
    if (!grids.length) return;
    if (!('IntersectionObserver' in window)) {
      grids.forEach(function (g) { g.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    grids.forEach(function (g) { io.observe(g); });
  })();

  /* ---------- Kinetic word reveal (flagship intro headline) ---------- */
  (function kineticWords() {
    var group = document.querySelector('.kinetic-words');
    if (!group) return;
    if (!('IntersectionObserver' in window)) {
      group.classList.add('play');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('play');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    io.observe(group);
  })();

  /* ---------- Buildings slider (A / B / C tabs) ---------- */
  (function buildingsSlider() {
    var tabsBar = document.getElementById('buildingsTabs');
    if (!tabsBar) return;
    var tabs = Array.prototype.slice.call(tabsBar.querySelectorAll('.buildings-tab'));
    var slides = document.querySelectorAll('.building-slide');

    function activate(building, opts) {
      tabs.forEach(function (t) {
        var active = t.getAttribute('data-building') === building;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      slides.forEach(function (s) {
        var active = s.getAttribute('data-building') === building;
        s.classList.toggle('is-active', active);
        if (active) s.removeAttribute('hidden'); else s.setAttribute('hidden', '');
      });
      if (opts && opts.scroll) {
        tabsBar.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activate(tab.getAttribute('data-building'), { scroll: true });
      });
    });

    tabsBar.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var idx = tabs.indexOf(document.activeElement);
      if (idx === -1) return;
      e.preventDefault();
      var next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      activate(tabs[next].getAttribute('data-building'));
    });
  })();

  /* Belt-and-braces: if this script fails to even reach this point (syntax
     error earlier etc.), the noscript stylesheet fallback in <head> still
     guarantees content is visible. */
})();
