(function (global) {
  'use strict';

  global.P30Widgets = global.P30Widgets || {};

  function noopDestroy() {
    return { destroy: function () {} };
  }

  global.P30WidgetRegistry = {
    resolve: function (widgetId, demoPath) {
      if (widgetId && global.P30Widgets[widgetId]) {
        return global.P30Widgets[widgetId].mount;
      }
      if (demoPath && global.P30Widgets.iframe) {
        return function (root, opts) {
          return global.P30Widgets.iframe.mount(root, Object.assign({ src: demoPath }, opts));
        };
      }
      return null;
    },

    mount: function (root, widgetId, demoPath, opts) {
      var fn = this.resolve(widgetId, demoPath);
      if (!fn) return noopDestroy();
      return fn(root, opts || {});
    },
  };
})(window);
