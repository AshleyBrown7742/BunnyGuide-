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

/* Recipe pop-ups: any [data-recipe] element opens window.RECIPES[id]. Deep link: #r-<id> */
(function () {
  var R = window.RECIPES;
  if (!R) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  var ov = document.createElement('div');
  ov.className = 'recipe-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  document.body.appendChild(ov);
  var lastFocus = null;
  function open(id, push) {
    var r = R[id]; if (!r) return;
    lastFocus = document.activeElement;
    ov.setAttribute('aria-label', r.title);
    ov.innerHTML = '<div class="recipe-card"><div class="rc-head"><span class="eyebrow">' + esc(r.tag) + '</span><h2>' + esc(r.title) +
      '</h2><div class="rc-meta"><span>Serves ' + esc(r.serves) + '</span><span>' + esc(r.time) + '</span></div>' +
      '<button class="rc-close" type="button" aria-label="Close recipe">&times;</button></div><div class="rc-body">' +
      '<h4>Ingredients</h4><ul class="check">' + r.ingredients.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' +
      '<h4 style="margin-top:18px">Steps</h4><ol class="steps">' + r.steps.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>' +
      (r.tip ? '<div class="callout tip"><strong>Bunny Tip</strong><p>' + esc(r.tip) + '</p></div>' : '') +
      '<div class="rc-actions"><button class="btn btn-ghost btn-sm rc-print" type="button">Print recipe</button><button class="btn btn-primary btn-sm rc-done" type="button">Close</button></div></div></div>';
    ov.classList.add('open'); document.body.style.overflow = 'hidden';
    if (push !== false) history.replaceState(null, '', '#r-' + id);
    ov.querySelector('.rc-close').focus();
  }
  function close() {
    if (!ov.classList.contains('open')) return;
    ov.classList.remove('open'); document.body.style.overflow = '';
    if (/^#r-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-recipe]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-recipe')); return; }
    if (e.target === ov || e.target.closest('.rc-close') || e.target.closest('.rc-done')) close();
    if (e.target.closest('.rc-print')) {
      document.body.classList.add('printing-recipe'); window.print();
      setTimeout(function () { document.body.classList.remove('printing-recipe'); }, 500);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  function fromHash() { var m = location.hash.match(/^#r-(.+)$/); if (m) open(m[1], false); }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();

/* Supplement library + pop-ups. Data: window.SUPPS. Deep link: #s-<id> */
(function () {
  var S = window.SUPPS;
  if (!S) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  var DIET = [['vegan', 'Vegan'], ['vegetarian', 'Vegetarian'], ['glutenFree', 'Gluten-free'], ['dairyFree', 'Dairy-free'], ['soyFree', 'Soy-free'], ['nonGMO', 'Non-GMO']];
  function mark(v) { return v === true ? '<span class="y">Yes</span>' : v === false ? '<span class="n">No</span>' : '<span class="u">Not listed</span>'; }
  var ov = document.createElement('div');
  ov.className = 'recipe-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  document.body.appendChild(ov);
  var lastFocus = null;
  function open(id, push) {
    var x = S[id]; if (!x) return;
    lastFocus = document.activeElement;
    ov.setAttribute('aria-label', x.name);
    var diet = DIET.map(function (d) { return '<div><span>' + d[1] + '</span>' + mark(x.diet[d[0]]) + '</div>'; }).join('') +
      '<div><span>Kosher</span><span class="u">Not confirmed</span></div>';
    ov.innerHTML = '<div class="recipe-card"><div class="rc-head"><span class="eyebrow">' + esc(x.brand) + ' · ' + esc(x.cat) + '</span><h2>' + esc(x.name) +
      '</h2><div class="rc-meta"><span>' + esc(x.size) + '</span></div><button class="rc-close" type="button" aria-label="Close">&times;</button></div><div class="rc-body">' +
      '<p>' + esc(x.what) + '</p>' +
      '<div class="rc-when"><strong>When to take it:</strong> ' + esc(x.when) + '<br><strong>Label directions:</strong> ' + esc(x.label) + '. <em>Your plan may differ. Follow your plan.</em></div>' +
      '<h4>How to take it</h4><ul class="check">' + x.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<h4 style="margin-top:18px">Ingredients</h4><ul class="clean">' + x.ingredients.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<p class="small muted" style="margin-top:6px"><strong>Other ingredients:</strong> ' + esc(x.other) + '</p>' +
      '<h4 style="margin-top:18px">Dietary info</h4><div class="diet-table">' + diet + '</div>' +
      (x.certs.length ? '<h4 style="margin-top:18px">Certifications &amp; quality</h4><ul class="clean">' + x.certs.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="callout warn"><strong>Tell us first / watch for</strong><ul class="clean">' + x.cautions.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="rc-actions"><button class="btn btn-ghost btn-sm rc-print" type="button">Print</button><button class="btn btn-primary btn-sm rc-done" type="button">Close</button></div></div></div>';
    ov.classList.add('open'); document.body.style.overflow = 'hidden';
    if (push !== false) history.replaceState(null, '', '#s-' + id);
    ov.querySelector('.rc-close').focus();
  }
  function close() {
    if (!ov.classList.contains('open')) return;
    ov.classList.remove('open'); document.body.style.overflow = '';
    if (/^#s-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-supp]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-supp')); return; }
    if (!ov.classList.contains('open')) return;
    if (e.target === ov || e.target.closest('.rc-close') || e.target.closest('.rc-done')) close();
    if (e.target.closest('.rc-print')) {
      document.body.classList.add('printing-recipe'); window.print();
      setTimeout(function () { document.body.classList.remove('printing-recipe'); }, 500);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  function fromHash() { var m = location.hash.match(/^#s-(.+)$/); if (m) open(m[1], false); }
  window.addEventListener('hashchange', fromHash);

  // Library grid
  var grid = document.getElementById('supp-grid');
  if (grid) {
    var ids = Object.keys(S).sort(function (a, b) { return S[a].name.localeCompare(S[b].name); });
    var cats = []; ids.forEach(function (i) { if (cats.indexOf(S[i].cat) < 0) cats.push(S[i].cat); });
    cats.sort();
    var state = { cat: 'All', diet: {} , q: '' };
    var chips = document.getElementById('supp-chips');
    chips.innerHTML = ['All'].concat(cats).map(function (c) { return '<button type="button" class="supp-chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === 'All') + '">' + esc(c) + '</button>'; }).join('') +
      [['vegan', 'Vegan'], ['vegetarian', 'Vegetarian'], ['glutenFree', 'Gluten-free'], ['dairyFree', 'Dairy-free']].map(function (d) {
        return '<button type="button" class="supp-chip diet" data-diet="' + d[0] + '" aria-pressed="false">' + d[1] + '</button>'; }).join('');
    function render() {
      var q = state.q.toLowerCase();
      var shown = ids.filter(function (i) {
        var x = S[i];
        if (state.cat !== 'All' && x.cat !== state.cat) return false;
        for (var k in state.diet) if (state.diet[k] && x.diet[k] !== true) return false;
        if (q) { var hay = (x.name + ' ' + x.brand + ' ' + x.what + ' ' + x.ingredients.join(' ') + ' ' + x.cat).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
        return true;
      });
      grid.innerHTML = shown.map(function (i) {
        var x = S[i], b = '';
        if (x.diet.vegan === true) b += '<span class="badge">Vegan</span>';
        else if (x.diet.vegetarian === true) b += '<span class="badge">Vegetarian</span>';
        else if (x.diet.vegetarian === false) b += '<span class="badge no">Animal-based</span>';
        if (x.diet.glutenFree === true) b += '<span class="badge">Gluten-free</span>';
        if (x.diet.dairyFree === true) b += '<span class="badge">Dairy-free</span>';
        return '<button type="button" class="supp-card" id="s-' + i + '" data-supp="' + i + '"><span class="sc-brand">' + esc(x.brand) + '</span><span class="sc-name">' + esc(x.name) +
          '</span><span class="sc-what">' + esc(x.what) + '</span><span class="badges">' + b + '</span><span class="sc-when"><strong>When:</strong> ' + esc(x.when) + '</span></button>';
      }).join('') || '<p class="muted">No supplements match. Try clearing a filter.</p>';
      document.getElementById('supp-count').textContent = 'Showing ' + shown.length + ' of ' + ids.length + ' supplements.';
    }
    chips.addEventListener('click', function (e) {
      var c = e.target.closest('.supp-chip'); if (!c) return;
      if (c.dataset.cat) {
        state.cat = c.dataset.cat;
        chips.querySelectorAll('[data-cat]').forEach(function (el) { el.setAttribute('aria-pressed', el === c ? 'true' : 'false'); });
      } else {
        var on = c.getAttribute('aria-pressed') !== 'true';
        c.setAttribute('aria-pressed', on ? 'true' : 'false'); state.diet[c.dataset.diet] = on;
      }
      render();
    });
    document.getElementById('supp-q').addEventListener('input', function (e) { state.q = e.target.value.trim(); render(); });
    render();
  }
  fromHash();
})();
