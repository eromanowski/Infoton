(function (global) {
  'use strict';

  /** Script paths relative to sites-v2/ */
  var DEPS = {
    learn: ['widgets/learn.js'],
    history: ['widgets/history.js'],
    impact: ['widgets/impact.js'],
    fleet: ['widgets/fleet.js'],
    hamming: ['widgets/lib/hamming-core.js', 'widgets/hamming.js'],
    encode: ['widgets/lib/encoder-core.js', 'widgets/encoder.js'],
    compare: [
      'widgets/lib/hamming-core.js',
      'widgets/lib/encoder-core.js',
      'widgets/hamming.js',
      'widgets/encoder.js',
      'widgets/compare.js',
    ],
  };

  var loaded = Object.create(null);
  var inflight = Object.create(null);

  function basePrefix() {
    if (/\/sites-v2\//.test(location.pathname)) return '';
    if (location.pathname.indexOf('compare-v2') >= 0) return 'sites-v2/';
    return 'sites-v2/';
  }

  function loadOne(path) {
    if (loaded[path]) return Promise.resolve();
    if (inflight[path]) return inflight[path];
    inflight[path] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = path;
      s.async = false;
      s.onload = function () {
        loaded[path] = true;
        delete inflight[path];
        resolve();
      };
      s.onerror = function () {
        delete inflight[path];
        reject(new Error('Failed to load ' + path));
      };
      document.head.appendChild(s);
    });
    return inflight[path];
  }

  function loadChain(files) {
    var base = basePrefix();
    return files.reduce(function (chain, file) {
      return chain.then(function () { return loadOne(base + file); });
    }, Promise.resolve());
  }

  function ensure(widgetId) {
    if (!widgetId || !DEPS[widgetId]) return Promise.resolve();
    return loadChain(DEPS[widgetId]);
  }

  function ensureConcept(concept) {
    if (!concept) return ensure('compare');
    if (concept.widget) return ensure(concept.widget);
    return Promise.resolve();
  }

  global.P30WidgetLoader = { ensure: ensure, ensureConcept: ensureConcept, deps: DEPS };
})(window);
