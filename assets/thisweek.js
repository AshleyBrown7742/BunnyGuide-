/* This Week guide. Any element with [data-this-week] becomes the week picker.
   Schedule matches the Your Program page. Edit WEEKS to change what each week shows. */
(function () {
  var hosts = document.querySelectorAll('[data-this-week]');
  if (!hosts.length) return;
  var L = {
    supp: ['Your supplement plan', 'supplements.html#core-5'],
    rules: ['Supplement safety rules', 'supplements.html#rules'],
    habits: ['Your habit priority list', 'daily-habits.html#priority'],
    water: ['Morning mineral water', 'daily-habits.html#hydration'],
    sun: ['Sunlight, three times a day', 'daily-habits.html#sun'],
    fast: ['ProLon fast guide', 'fast-days.html'],
    fastcheck: ['Fast day checklist', 'fast-days.html#fast-checklist'],
    food: ['Food, meals & recipes', 'food.html'],
    symptoms: ['Foods for how you feel', 'food.html#foods-for-symptoms'],
    quick: ['Quick help by symptom', 'remedies.html#quick-help'],
    tracker: ['Log this week in Heads Up', 'tracker.html'],
    blood: ['Blood draw prep', 'testing.html#blood-draw'],
    gut: ['Gut test: how to collect', 'testing.html#gut-test'],
    gutsupport: ['Personalized gut support', 'supplements.html#gut-support'],
    rx: ['Lip Bunny Rx guides', 'lip-bunny-rx.html'],
    after: ['After graduation', 'your-program.html#after'],
    mind: ['Stress and your nervous system', 'daily-habits.html#nervous-system']
  };
  function fastWeeks(reset) { return reset === 8 ? [4, 8] : [4, 8, 12]; }
  var VISITS = { 1: 'Results review · in person · 70 min', 3: 'Virtual check-in · 20 min', 8: 'In-person check-in + targeted labs · 30 min',
    12: 'Virtual check-in + gut retest · 20 min', 15: 'Full recheck labs · in person', 16: 'Graduation · in person · 60 min' };
  function plan(w, reset) {
    var fasts = fastWeeks(reset), isFast = fasts.indexOf(w) > -1, todo = [], read = [], title = '';
    if (w === 1) { title = 'Your plan begins'; todo = ['Come to your 70-minute results review.', 'Start your supplements one at a time, as your plan says.', 'Pick the first habit to focus on.']; read = ['supp', 'rules', 'habits']; }
    else if (w === 2) { title = 'Settle in'; todo = ['Keep adding supplements one at a time.', 'Morning mineral water every day.', 'Reply to your weekly check-in text.']; read = ['water', 'rules', 'quick']; }
    else if (w === 3) { title = 'First check-in'; todo = ['Join your 20-minute virtual check-in.', 'Log in Heads Up and bring your questions.', 'Put your first fast day on the calendar.']; read = ['tracker', 'fast', 'symptoms']; }
    else if (w === 4) { title = 'Fast day week'; todo = ['Do your first ProLon fast day.', 'Pause supplements on the fast day only.', 'Break the fast gently the next morning.']; read = ['fast', 'fastcheck', 'water']; }
    else if (w >= 5 && w <= 6) { title = 'Build the rhythm'; todo = ['Add your next habit from the list.', 'Get sunlight morning, midday and sunset.', 'Try two new recipes this week.']; read = ['habits', 'sun', 'food']; }
    else if (w === 7) { title = 'Halfway prep'; todo = ['Your week 8 visit and labs are next week.', 'Read blood draw prep now: some supplements stop 7 days before.', 'Keep logging in Heads Up.']; read = ['blood', 'tracker', 'mind']; }
    else if (w === 8) { title = reset === 8 ? 'Reset graduation + labs' : 'Halfway point + labs'; todo = ['In-person check-in with targeted labs.', reset === 8 ? 'You graduate your Reset phase and move into maintenance habits, plus GLP-1 or hormone therapy if clinically indicated.' : 'Pick up your next 8 weeks of supplements and fast kits.', 'Fast day #2 this week.']; read = ['blood', 'fast', 'rx']; }
    else if (w >= 9 && w <= 10) { title = reset === 8 ? 'Maintenance mode' : 'Keep going'; todo = ['Keep your habits steady. Consistency is the protocol.', 'Started GLP-1 or hormones? Review your Rx guide.', 'Reply to your weekly check-in text.']; read = ['rx', 'symptoms', 'tracker']; }
    else if (w === 11) { title = 'Gut retest is next'; todo = ['Your gut retest goes out next week.', 'Plan to pause probiotics 3 to 5 days before you collect.', 'Keep eating like you normally do.']; read = ['gut', 'gutsupport', 'food']; }
    else if (w === 12) { title = 'Check-in + gut retest'; todo = ['Join your 20-minute virtual check-in.', 'Collect and mail your gut retest the same or next day.', isFast ? 'Fast day #3 this week.' : 'Keep your habits steady.']; read = ['gut', isFast ? 'fast' : 'habits', 'tracker']; }
    else if (w >= 13 && w <= 14) { title = 'Home stretch'; todo = ['Full recheck labs are coming in week 15.', 'Biotin and collagen stop 7 days before your draw.', 'Write down your wins so far.']; read = ['blood', 'tracker', 'mind']; }
    else if (w === 15) { title = 'Recheck labs'; todo = ['Your full recheck blood draw.', 'Follow blood draw prep.', 'Review your Heads Up progress before graduation.']; read = ['blood', 'tracker', 'after']; }
    else if (w === 16) { title = 'Graduation'; todo = ['Celebrate at your 60-minute graduation visit.', 'Compare your before and after.', 'Choose your next step.']; read = ['after', 'supp', 'rx']; }
    return { title: title, visit: VISITS[w] || '', fast: isFast, todo: todo, read: read };
  }
  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  hosts.forEach(function (host) {
    var state = { week: get('lbw-week', 1), reset: get('lbw-reset', 16) };
    host.innerHTML = '<div class="week-tool"><div class="week-head"><div><span class="eyebrow">This Week</span><h2 style="margin-top:4px">What to do this week</h2>' +
      '<p class="muted small" style="margin:6px 0 0">Pick your program week. Week 1 is the week of your results review.</p></div>' +
      '<div class="reset-toggle" role="group" aria-label="Reset length"><button type="button" data-r="8">8-week Reset</button><button type="button" data-r="16">16-week Reset</button></div></div>' +
      '<div class="week-strip" role="group" aria-label="Program week"></div>' +
      '<div class="week-legend"><span><i></i>Visit</span><span><i class="f"></i>Fast day</span><span>Saved on this device only</span></div>' +
      '<div class="week-body"></div></div>';
    var strip = host.querySelector('.week-strip'), body = host.querySelector('.week-body');
    function render() {
      var fasts = fastWeeks(state.reset), s = '';
      for (var w = 1; w <= 16; w++) {
        s += '<button type="button" data-w="' + w + '" class="' + (VISITS[w] ? 'visit ' : '') + (fasts.indexOf(w) > -1 ? 'fast' : '') + '" aria-pressed="' + (w === state.week) + '" aria-label="Week ' + w + '">' + w + '</button>';
      }
      strip.innerHTML = s;
      host.querySelectorAll('.reset-toggle button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.r === state.reset)); });
      var p = plan(state.week, state.reset);
      body.innerHTML = '<div><span class="tag">Week ' + state.week + '</span><p class="wk-title">' + p.title + '</p>' +
        (p.visit ? '<p><strong>Visit:</strong> ' + p.visit + '</p>' : '<p class="muted">No visit this week. Watch for your weekly check-in text.</p>') +
        (p.fast ? '<p><strong>Fast day this week.</strong> Default is Wednesday.</p>' : '') +
        '<h4 style="margin-top:10px">Your to-do</h4><ul>' + p.todo.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>' +
        '<div class="wk-box"><h4>Read this week</h4><div class="wk-reads">' + p.read.map(function (k) { return '<a href="' + L[k][1] + '">' + L[k][0] + ' &rarr;</a>'; }).join('') + '</div></div>';
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-w]'); if (b) { state.week = +b.dataset.w; set('lbw-week', state.week); render(); return; }
      var r = e.target.closest('[data-r]'); if (r) { state.reset = +r.dataset.r; set('lbw-reset', state.reset); render(); }
    });
    render();
  });
})();
