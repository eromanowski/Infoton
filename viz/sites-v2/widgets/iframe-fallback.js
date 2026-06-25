(function (global) {
  'use strict';

  function mountIframe(root, opts) {
    var base = /\/sites-v2\//.test(location.pathname) ? '../' : '';
    var src = opts.src ? base + opts.src : '';
    var tall = opts.tall ? ' demo-mount-tall' : '';
    root.innerHTML =
      '<iframe class="wgt-iframe' + tall + '" title="' + (opts.title || 'Demo') + '" loading="lazy" src="' + src + '"></iframe>';
    if (opts.phase2) {
      var note = document.createElement('p');
      note.className = 'wgt-phase2-note';
      note.textContent = 'Phase 2 — native widget migration in progress';
      root.appendChild(note);
    }
    return {
      destroy: function () {
        root.innerHTML = '';
      },
    };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.iframe = { mount: mountIframe };
})(window);
