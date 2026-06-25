(function (global) {
  'use strict';

  var concepts = global.P30_CONCEPTS;
  var thesis = global.P30_THESIS;
  var story = global.P30_STORY;
  var navItems = global.P30_NAV;

  var DEMO_BASE = /\/sites\//.test(location.pathname) ? '../' : '';

  function demoUrl(path) {
    return path ? DEMO_BASE + path : '';
  }

  function conceptById(id) {
    for (var i = 0; i < concepts.length; i++) {
      if (concepts[i].id === id) return concepts[i];
    }
    return null;
  }

  function beatIndex(id) {
    var i = story.beats.indexOf(id);
    return i;
  }

  function parseRoute() {
    var hash = location.hash.replace(/^#\/?/, '').split('?')[0];
    return hash || 'home';
  }

  function setBodyTheme(theme) {
    document.body.className = theme ? 'theme-' + theme : 'page-home';
  }

  function statsHtml(stats) {
    return (stats || []).map(function (s) {
      return '<span class="concept-stat">' + s + '</span>';
    }).join('');
  }

  function renderProgress(activeId) {
    var isHome = activeId === 'home';
    var steps = story.beats.map(function (id, i) {
      var c = conceptById(id);
      var active = activeId === id;
      var done = !isHome && beatIndex(activeId) > i;
      var cls = 'story-step' + (active ? ' is-active' : '') + (done ? ' is-done' : '');
      return (
        '<a class="' + cls + '" href="#/' + id + '" title="' + c.title + '">' +
          '<span class="story-step-num">' + (i + 1) + '</span>' +
          '<span class="story-step-lab">' + story.beatLabels[i] + '</span>' +
        '</a>'
      );
    }).join('');

    return (
      '<div class="story-rail" aria-label="Briefing progress">' +
        '<a class="story-rail-home' + (isHome ? ' is-active' : '') + '" href="#/">Overview</a>' +
        '<div class="story-rail-track">' + steps + '</div>' +
      '</div>'
    );
  }

  function stickyBar(id) {
    var idx = beatIndex(id);
    if (idx < 0) {
      return (
        '<div class="sticky-bar">' +
          '<a class="sticky-btn ghost" href="#/">← Overview</a>' +
          '<a class="sticky-btn primary" href="#/hamming">Begin briefing →</a>' +
        '</div>'
      );
    }
    var prev = idx > 0 ? story.beats[idx - 1] : null;
    var next = idx < story.beats.length - 1 ? story.beats[idx + 1] : null;
    var prevC = prev ? conceptById(prev) : null;
    var nextC = next ? conceptById(next) : null;
    return (
      '<div class="sticky-bar">' +
        (prev
          ? '<a class="sticky-btn ghost" href="#/' + prev + '">← ' + story.beatLabels[idx - 1] + '</a>'
          : '<a class="sticky-btn ghost" href="#/">← Overview</a>') +
        '<span class="sticky-progress">' + (idx + 1) + ' / ' + story.beats.length + '</span>' +
        (next
          ? '<a class="sticky-btn primary" href="#/' + next + '">' + story.beatLabels[idx + 1] + ' →</a>'
          : '<a class="sticky-btn primary" href="#/">Finish · Overview →</a>') +
      '</div>'
    );
  }

  function renderHome() {
    var t = thesis;
    var ask = t.ask;

    var metrics = t.metrics.map(function (m) {
      return (
        '<div class="metric-card">' +
          '<div class="metric-val">' + m.val + '</div>' +
          '<div class="metric-lab">' + m.lab + '</div>' +
          '<div class="metric-sub">' + m.sub + '</div>' +
        '</div>'
      );
    }).join('');

    var pillars = t.pillars.map(function (p) {
      return (
        '<article class="pillar-card">' +
          '<span class="pillar-num">' + p.num + '</span>' +
          '<h3>' + p.title + '</h3>' +
          '<p>' + p.body + '</p>' +
        '</article>'
      );
    }).join('');

    var phases = ask.phases.map(function (p) {
      return (
        '<div class="ask-row">' +
          '<div class="ask-phase">' + p.phase + '</div>' +
          '<div class="ask-body">' +
            '<strong>' + p.funds + '</strong>' +
            '<span>' + p.milestone + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var risks = t.risks.map(function (r) { return '<li>' + r + '</li>'; }).join('');
    var trust = t.trust.map(function (x) { return '<li>' + x + '</li>'; }).join('');

    var appendix = story.appendix.map(function (id) {
      var c = conceptById(id);
      return '<a class="appendix-link" href="#/' + id + '">' + c.title + ' →</a>';
    }).join('');

    return (
      '<div class="deck page-enter">' +
        renderProgress('home') +

        '<section class="hero">' +
          '<p class="hero-eyebrow">' + t.eyebrow + '</p>' +
          '<h1>' + t.headline.replace('1964 byte tax', '<em>1964 byte tax</em>') + '</h1>' +
          '<p class="hero-hook">' + t.hookLine + '</p>' +
          '<p class="hero-sub">' + t.subhead + '</p>' +
          '<div class="metric-row">' + metrics + '</div>' +
          '<div class="hero-cta">' +
            '<a class="btn btn-primary btn-lg" href="#/' + ask.ctaPrimary.route + '">' + ask.ctaPrimary.label + ' →</a>' +
            '<a class="btn btn-ghost" href="#/' + ask.ctaSecondary.route + '">' + ask.ctaSecondary.label + '</a>' +
          '</div>' +
        '</section>' +

        '<section class="proof-embed">' +
          '<div class="section-head">' +
            '<span class="section-tag">The proof</span>' +
            '<h2>See it in sixty seconds</h2>' +
            '<p>Press Run once below — or <a href="#/compare">open full-screen proof</a>.</p>' +
          '</div>' +
          '<div class="demo-shell demo-shell-hero">' +
            '<iframe title="P30 vs Traditional preview" loading="lazy" src="' + demoUrl('compare.html') + '"></iframe>' +
          '</div>' +
        '</section>' +

        '<section class="pillars">' +
          '<div class="section-head">' +
            '<span class="section-tag">Why this wins</span>' +
            '<h2>Three reasons the IC should care</h2>' +
          '</div>' +
          '<div class="pillar-grid">' + pillars + '</div>' +
        '</section>' +

        '<section class="ask-block">' +
          '<div class="section-head">' +
            '<span class="section-tag">The ask</span>' +
            '<h2>' + ask.headline + '</h2>' +
          '</div>' +
          '<div class="ask-table">' + phases + '</div>' +
          '<div class="hero-cta">' +
            '<a class="btn btn-primary" href="#/' + ask.ctaPrimary.route + '">' + ask.ctaPrimary.label + ' →</a>' +
            '<a class="btn btn-ghost" href="#/' + ask.ctaClose.route + '">' + ask.ctaClose.label + '</a>' +
          '</div>' +
        '</section>' +

        '<section class="trust-block">' +
          '<div class="trust-grid">' +
            '<div class="trust-col">' +
              '<h3>Credibility</h3>' +
              '<ul>' + trust + '</ul>' +
            '</div>' +
            '<div class="trust-col trust-risks">' +
              '<h3>We will not hide</h3>' +
              '<ul>' + risks + '</ul>' +
            '</div>' +
          '</div>' +
        '</section>' +

        '<section class="appendix-block">' +
          '<p class="appendix-lead">Deep dives · appendix</p>' +
          '<div class="appendix-links">' + appendix + '</div>' +
        '</section>' +
      '</div>'
    );
  }

  function renderAppendixExtra(c) {
    if (c.id === 'physics') {
      return (
        '<div class="physics-eq">' +
          '<div class="eq">E ≥ k<sub>B</sub> T ln(2) ≈ 3.35 zJ @ 350 K</div>' +
        '</div>' +
        '<div class="mini-links">' +
          '<a href="#/compare">Proof →</a>' +
          '<a href="#/learn">Diligence →</a>' +
          '<a href="https://doi.org/10.5281/zenodo.18210355" target="_blank" rel="noopener">Zenodo →</a>' +
        '</div>'
      );
    }
    if (c.id === 'mitochondria') {
      return (
        '<div class="explore-stage">' +
          '<div class="svg-viz" aria-hidden="true">' +
            '<svg viewBox="0 0 300 300"><ellipse cx="150" cy="150" rx="94" ry="68" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.7)" stroke-width="2"/></svg>' +
          '</div>' +
          '<div class="cell-copy"><p>Second-act market · size the core round on data-center economics first.</p></div>' +
        '</div>'
      );
    }
    if (c.id === 'atomic') {
      return (
        '<div class="ask-table compact">' +
          '<div class="ask-row"><div class="ask-phase">Phase 1</div><div class="ask-body"><strong>Library proof</strong><span>Funded now</span></div></div>' +
          '<div class="ask-row"><div class="ask-phase">Phase 2</div><div class="ask-body"><strong>FPGA soak</strong><span>Measured thermal</span></div></div>' +
          '<div class="ask-row"><div class="ask-phase">Phase 3</div><div class="ask-body"><strong>Sky130 MPW</strong><span>75× native</span></div></div>' +
        '</div>'
      );
    }
    return '';
  }

  function renderChapter(c) {
    var demo = c.demo
      ? (
        '<section class="demo-shell' + (c.id === 'compare' ? ' demo-shell-tall' : '') + '">' +
          (c.demoLabel ? '<div class="demo-shell-head">' + c.demoLabel + '</div>' : '') +
          '<div class="demo-frame"><iframe title="' + c.title + '" loading="lazy" src="' + demoUrl(c.demo) + '"></iframe></div>' +
        '</section>'
      )
      : renderAppendixExtra(c);

    return (
      '<div class="deck deck-chapter page-enter">' +
        renderProgress(c.id) +
        '<header class="slide-hero">' +
          '<p class="slide-act">' + c.chapter + '</p>' +
          '<h1>' + (c.titleHtml || c.title) + '</h1>' +
          '<p class="slide-lead">' + c.pitch + '</p>' +
          '<div class="concept-stats">' + statsHtml(c.stats) + '</div>' +
        '</header>' +
        '<div class="insight-panel">' +
          (c.hook ? '<p class="insight-hook">' + c.hook + '</p>' : '') +
          (c.takeaway ? '<div class="insight-takeaway">' + c.takeaway + '</div>' : '') +
          (c.riskNote ? '<p class="insight-risk">' + c.riskNote + '</p>' : '') +
        '</div>' +
        demo +
        (c.footerNote ? '<footer class="slide-foot">' + c.footerNote + '</footer>' : '') +
        stickyBar(c.id) +
      '</div>'
    );
  }

  function renderNav(activeRoute) {
    var el = document.getElementById('navLinks');
    if (!el) return;
    el.innerHTML = navItems.map(function (item) {
      var route = item.route || 'home';
      var active = activeRoute === route ? ' active' : '';
      var href = item.route ? '#/' + item.route : '#/';
      return '<a class="nav-link' + active + '" href="' + href + '">' + item.label + '</a>';
    }).join('');
  }

  function route() {
    var id = parseRoute();
    var app = document.getElementById('app');
    if (!app) return;

    if (id === 'home') {
      setBodyTheme(null);
      document.title = 'Infoton P30 — Investor Brief';
      app.innerHTML = renderHome();
      renderNav('home');
      return;
    }

    var c = conceptById(id);
    if (!c) {
      location.hash = '#/';
      return;
    }

    setBodyTheme(c.theme);
    document.title = c.title + ' · Infoton P30';
    app.innerHTML = renderChapter(c);
    renderNav(id);
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.disabled');
    if (a) e.preventDefault();
  });

  global.P30App = { route: route };

  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/';
  route();
})(window);
