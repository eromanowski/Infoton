(function (global) {
  'use strict';

  var WIDGET_ROOT = '../sites-v2/';
  var DEPS = {
    mitochondria: ['widgets/lib/mitochondria-core.js', 'widgets/mitochondria.js'],
  };

  var loaded = Object.create(null);
  var inflight = Object.create(null);

  function loadOne(path) {
    if (loaded[path]) return Promise.resolve();
    if (inflight[path]) return inflight[path];
    inflight[path] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = WIDGET_ROOT + path;
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
    return files.reduce(function (chain, file) {
      return chain.then(function () { return loadOne(file); });
    }, Promise.resolve());
  }

  function ensure(widgetId) {
    if (!widgetId || !DEPS[widgetId]) return Promise.resolve();
    return loadChain(DEPS[widgetId]);
  }

  function ensureConcept(concept) {
    if (!concept || !concept.widget) return Promise.resolve();
    return ensure(concept.widget);
  }

  global.P30WidgetLoader = { ensure: ensure, ensureConcept: ensureConcept, deps: DEPS };
})(window);
