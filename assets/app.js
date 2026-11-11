/* Patient Guide: menu, search, small helpers. Search index comes from search-index.js (window.GUIDE_INDEX). */
(function () {
  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var links = document.querySelector('.nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Search
  var overlay = document.getElementById('search');
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var INDEX = window.GUIDE_INDEX || [];
  var sel = -1;

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function openSearch(q) {
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = q || '';
    run();
    setTimeout(function () { input.focus(); }, 30);
  }
  function closeSearch() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  window.openSearch = openSearch;

  function score(item, terms) {
    var t = norm(item.t), p = norm(item.p), b = norm(item.b), k = norm(item.k || '');
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var w = terms[i], hit = false;
      if (t.indexOf(w) > -1) { s += 15; hit = true; }
      if (k.indexOf(w) > -1) { s += 8; hit = true; }
      if (p.indexOf(w) > -1) { s += 2; hit = true; }
      if (b.indexOf(w) > -1) { s += 3; hit = true; }
      if (!hit) return 0;
    }
    return s;
  }
  function snippet(body, terms) {
    var nb = norm(body), pos = -1;
    for (var i = 0; i < terms.length && pos < 0; i++) pos = nb.indexOf(terms[i]);
    var start = Math.max(0, pos - 50);
    var s = (start > 0 ? '…' : '') + body.substr(start, 170) + (body.length > start + 170 ? '…' : '');
    s = esc(s);
    terms.forEach(function (w) {
      if (w.length < 2) return;
      s = s.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return s;
  }
  function run() {
    var q = norm(input.value.trim());
    sel = -1;
    if (!q) {
      results.innerHTML = '<div class="no-results">Try <a href="#" data-q="lemon water">lemon water</a>, <a href="#" data-q="injection">injection</a>, <a href="#" data-q="fast day">fast day</a>, <a href="#" data-q="blood draw">blood draw</a>, or <a href="#" data-q="bloating">bloating</a>.</div>';
      return;
    }
    var terms = q.split(/\s+/).filter(Boolean);
    var hits = INDEX.map(function (it) { return { it: it, s: score(it, terms) }; })
      .filter(function (h) { return h.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 12);
    if (!hits.length) {
      results.innerHTML = '<div class="no-results">No matches yet. Questions? Call <a href="tel:+15083882200">(508) 388-2200</a> or message us in the Symplast for Patients app.</div>';
      return;
    }
    results.innerHTML = hits.map(function (h) {
      return '<a class="result" href="' + h.it.u + '"><div class="r-page">' + esc(h.it.p) + '</div><div class="r-title">' +
        esc(h.it.t) + '</div><div class="r-snip">' + snippet(h.it.b, terms) + '</div></a>';
    }).join('');
  }
  if (overlay) {
    input.addEventListener('input', run);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('close')) closeSearch();
      var q = e.target.getAttribute && e.target.getAttribute('data-q');
      if (q) { e.preventDefault(); input.value = q; run(); input.focus(); }
    });
    results.addEventListener('click', function (e) {
      if (e.target.closest('.result')) closeSearch();
    });
    input.addEventListener('keydown', function (e) {
      var items = results.querySelectorAll('.result');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (el, i) { el.classList.toggle('sel', i === sel); });
        items[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        var target = items[sel > -1 ? sel : 0];
        if (target) { closeSearch(); window.location.href = target.getAttribute('href'); }
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closeSearch();
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && tag !== 'input' && tag !== 'textarea') { e.preventDefault(); openSearch(); }
  });
  document.querySelectorAll('[data-open-search]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openSearch(el.getAttribute('data-open-search') || ''); });
  });
  var heroForm = document.getElementById('hero-search');
  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      openSearch(heroForm.querySelector('input').value);
    });
  }

  // Open an accordion if the URL hash points into it
  function openHash() {
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    var d = el.tagName === 'DETAILS' ? el : el.closest('details');
    if (d) { d.open = true; setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 50); }
  }
  window.addEventListener('hashchange', openHash);
  openHash();
})();
