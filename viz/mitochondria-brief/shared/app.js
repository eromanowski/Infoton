(function (global) {
  'use strict';

  var concepts = global.MITO_CONCEPTS;
  var thesis = global.MITO_THESIS;
  var story = global.MITO_STORY;
  var navItems = global.MITO_NAV;
  var registry = global.P30WidgetRegistry;
  var loader = global.P30WidgetLoader;

  var activeWidget = null;
  var INSTRUMENT_SLIDES = { calculator: 1 };
  var FIRST_BEAT = story.beats[0];

  function conceptById(id) {
    for (var i = 0; i < concepts.length; i++) {
      if (concepts[i].id === id) return concepts[i];
    }
    return null;
  }

  function beatIndex(id) {
    return story.beats.indexOf(id);
  }

  function parseRoute() {
    var hash = location.hash.replace(/^#\/?/, '').split('?')[0];
    return hash || 'home';
  }

  function setBodyTheme(theme) {
    document.body.className = theme ? 'theme-' + theme : 'page-home';
  }

  function destroyWidget() {
    if (activeWidget && activeWidget.destroy) {
      activeWidget.destroy();
    }
    activeWidget = null;
  }

  function showDemoLoading(mountEl) {
    if (!mountEl) return;
    mountEl.innerHTML =
      '<div class="demo-loading" aria-busy="true">' +
        '<span class="demo-loading-spin"></span>' +
        '<span>Loading demo…</span>' +
      '</div>';
  }

  function mountDemo(mountEl, c, opts) {
    if (!mountEl || !loader) return;
    destroyWidget();
    showDemoLoading(mountEl);

    var o = opts || { embed: true };
    if (c) o.title = c.title;

    loader.ensureConcept(c).then(function () {
      if (!document.body.contains(mountEl)) return;
      mountEl.innerHTML = '';
      activeWidget = registry.mount(mountEl, c ? c.widget : null, c ? c.demo : null, o);
    }).catch(function () {
      mountEl.innerHTML = '<p class="demo-error">Demo failed to load.</p>';
    });
  }

  function demoShellHtml(c) {
    if (!c.widget && !c.demo) return '';
    var cls = 'demo-shell';
    if (INSTRUMENT_SLIDES[c.id]) cls += ' demo-shell-instrument';
    var head = '';
    if (c.demoSectionTitle || c.demoLead) {
      head =
        '<div class="live-proof-section">' +
          '<h3 class="live-proof-title">' + (c.demoSectionTitle || 'Live demo') + '</h3>' +
          (c.demoSectionSubtitle
            ? '<p class="live-proof-sub">' + c.demoSectionSubtitle + '</p>'
            : '') +
          '<p class="live-proof-lead">' + (c.demoLead || '') + '</p>' +
        '</div>';
    }
    return (
      '<section class="' + cls + '">' +
        head +
        '<div class="demo-mount" id="demo-mount"></div>' +
      '</section>'
    );
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
          '<a class="sticky-btn primary" href="#/' + FIRST_BEAT + '">Begin briefing →</a>' +
        '</div>'
      );
    }
    var prev = idx > 0 ? story.beats[idx - 1] : null;
    var next = idx < story.beats.length - 1 ? story.beats[idx + 1] : null;
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
          '<h1>' + (t.headlineHtml || t.headline) + '</h1>' +
          '<p class="hero-hook">' + t.hookLine + '</p>' +
          '<p class="hero-sub">' + t.subhead + '</p>' +
          '<div class="metric-row">' + metrics + '</div>' +
          '<div class="hero-cta">' +
            '<a class="btn btn-primary btn-lg" href="#/' + ask.ctaPrimary.route + '">' + ask.ctaPrimary.label + ' →</a>' +
            '<a class="btn btn-ghost" href="#/' + ask.ctaSecondary.route + '">' + ask.ctaSecondary.label + '</a>' +
          '</div>' +
        '</section>' +
        '<section class="proof-embed">' +
          '<section class="demo-shell demo-shell-hero demo-shell-instrument">' +
            '<div class="live-proof-section">' +
              '<h3 class="live-proof-title">Live demo</h3>' +
              '<p class="live-proof-lead">Drag Δψ<sub>m</sub> on the Quantum Heartbeat calculator — or <a href="#/calculator">open the full demo slide</a>.</p>' +
            '</div>' +
            '<div class="demo-mount" id="demo-mount"></div>' +
          '</section>' +
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
            '<div class="trust-col"><h3>Credibility</h3><ul>' + trust + '</ul></div>' +
            '<div class="trust-col trust-risks"><h3>We will not hide</h3><ul>' + risks + '</ul></div>' +
          '</div>' +
        '</section>' +
        (appendix
          ? '<section class="appendix-block">' +
              '<p class="appendix-lead">Related · appendix</p>' +
              '<div class="appendix-links">' + appendix + '</div>' +
            '</section>'
          : '') +
      '</div>'
    );
  }

  function renderExtra(c) {
    return c.extraHtml || '';
  }

  function renderChapter(c) {
    var demo = (c.widget || c.demo) ? demoShellHtml(c) : renderExtra(c);
    return (
      '<div class="deck deck-chapter">' +
        '<div class="page-enter">' +
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
        '</div>' +
        stickyBar(c.id) +
      '</div>'
    );
  }

  function renderNav(activeRoute) {
    var el = document.getElementById('navLinks');
    if (!el) return;
    el.innerHTML = navItems.map(function (item) {
      if (item.href) {
        return '<a class="nav-link nav-link-ext" href="' + item.href + '">' + item.label + '</a>';
      }
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

    destroyWidget();

    if (id === 'home') {
      setBodyTheme(null);
      document.title = 'Virtual Mitochondria — Investor Brief';
      app.innerHTML = renderHome();
      renderNav('home');
      mountDemo(document.getElementById('demo-mount'), conceptById('calculator'), { embed: true, compact: true });
      return;
    }

    var c = conceptById(id);
    if (!c) {
      location.hash = '#/';
      return;
    }

    setBodyTheme(c.theme);
    document.title = c.title + ' · Virtual Mitochondria';
    app.innerHTML = renderChapter(c);
    renderNav(id);
    if (c.widget || c.demo) {
      mountDemo(document.getElementById('demo-mount'), c, { embed: true, compact: c.id !== 'calculator' });
    }
    window.scrollTo(0, 0);
  }

  global.MitoApp = { route: route, destroyWidget: destroyWidget };

  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/';
  route();
})(window);
