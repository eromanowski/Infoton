(function (global) {
  'use strict';

  global.P30_DEFAULT_SENTENCE =
    "The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.";

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function charBits(ch) {
    var code = (ch || ' ').charCodeAt(0) & 0xff;
    return code.toString(2).padStart(8, '0');
  }

  global.P30DemoUtil = { esc: esc, charBits: charBits };
})(window);
