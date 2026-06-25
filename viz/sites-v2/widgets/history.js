(function (global) {
  'use strict';

  var ROWS = [
    { year: '1956', co: 'IBM', name: 'Stretch (7030), first memo', bw: '1 to 6 bits', tag: 'variable',
      desc: 'The word byte is coined, defined as any number of parallel bits from one to six.',
      bits: { n: 6, pattern: 'flex' } },
    { year: '1956', co: 'MIT / RAND / IBM', name: 'SAGE air defense', bw: '~4 bits', tag: 'variable',
      desc: 'Louis Dooley uses byte for an undefined grouping, typically four bits.',
      bits: { n: 4, pattern: 'flex' } },
    { year: '1956', co: 'IBM', name: 'Stretch, design revision', bw: '8 bits', tag: '',
      desc: 'Eight-bit bytes are considered in August and incorporated into Stretch.',
      bits: { n: 8, pattern: 'on' } },
    { year: '1959', co: 'IBM', name: 'BCDIC card encoding', bw: '6 bits', tag: '',
      desc: 'Six-bit binary coded decimal carries character data across the product line.',
      bits: { n: 6, pattern: 'on' } },
    { year: '1961', co: 'Rolf Landauer', name: 'Landauer\u2019s Principle', bw: 'physics established', tag: 'none', cls: 'landauer',
      desc: 'Information costs energy and produces heat — in IBM\u2019s own journal.',
      eq: 'E \u2265 k<sub>B</sub> T ln(2)' },
    { year: '1964', co: 'IBM', name: 'System/360 Specification', bw: '8 bits, fixed', tag: '', cls: 'spec',
      desc: 'The 8-bit byte is promulgated as the standard via System/360 and EBCDIC.',
      bits: { n: 8, pattern: 'on' },
      missing: 'No k<sub>B</sub> T ln(2) term. The energy floor is absent from the sheet.' },
    { year: '1993', co: 'Unicode / ISO', name: 'Unicode replaces ASCII', bw: '16-bit and beyond', tag: 'green', cls: 'precedent',
      desc: 'Unicode replaces ASCII in Windows NT 3.1. IBM, Microsoft, Apple, Sun move the industry off fixed 8-bit.',
      wide: 'multi-octet encoding',
      proof: 'Encoding updates have been done before' },
    { year: '2026', co: 'Infoton', name: 'Infoton P30', bw: 'primorial-30 encoding', tag: 'green', cls: 'future',
      desc: 'P30 is deployable now to cut the checking overhead driving the data-center power crisis.',
      p30: 'P30 \u00b7 validity-intrinsic',
      proof: 'Deployable immediately', proofNow: true },
  ];

  function bitsHtml(r) {
    if (r.bits) {
      var h = '<div class="wgt-bt-bits">';
      for (var b = 0; b < r.bits.n; b++) {
        var c = r.bits.pattern === 'flex' ? 'flex' : 'on';
        var label = r.bits.pattern === 'flex' ? '?' : (b % 2 === 0 ? '1' : '0');
        h += '<div class="wgt-bt-bit ' + c + '">' + label + '</div>';
      }
      return h + '</div>';
    }
    if (r.wide) return '<div class="wgt-bt-bits"><div class="wgt-bt-bit wide">' + r.wide + '</div></div>';
    if (r.p30) return '<div class="wgt-bt-bits"><div class="wgt-bt-bit p30">' + r.p30 + '</div></div>';
    return '';
  }

  function mountHistory(root) {
    var cards = ROWS.map(function (r) {
      return (
        '<div class="wgt-bt-card' + (r.cls ? ' ' + r.cls : '') + '">' +
          '<div class="wgt-bt-year"><div class="wgt-bt-yr-num">' + r.year + '</div><div class="wgt-bt-yr-co">' + r.co + '</div></div>' +
          '<div class="wgt-bt-body">' +
            '<div class="wgt-bt-machine"><span class="wgt-bt-name">' + r.name + '</span><span class="wgt-bt-bw ' + r.tag + '">' + r.bw + '</span></div>' +
            '<div class="wgt-bt-desc">' + r.desc + '</div>' +
            bitsHtml(r) +
            (r.eq ? '<div class="wgt-bt-eq"><b>' + r.eq + '</b></div>' : '') +
            (r.missing ? '<div class="wgt-bt-missing"><span class="wgt-bt-x">MISSING</span>' + r.missing + '</div>' : '') +
            (r.proof ? '<div class="wgt-bt-proof' + (r.proofNow ? ' now' : '') + '">\u2713 ' + r.proof + '</div>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('');

    root.innerHTML =
      '<div class="wgt wgt-history">' +
        '<div class="wgt-stage wgt-stage-history">' +
          '<div class="wgt-work">' +
            '<div class="wgt-bt-rail">' + cards + '</div>' +
            '<div class="wgt-bt-floor">' +
              '<div class="wgt-bt-floor-t">The Floor That Was Left Out</div>' +
              '<div class="wgt-bt-floor-eq">E &ge; <b>k<sub>B</sub> T ln(2)</b></div>' +
              '<div class="wgt-bt-floor-cap">Landauer published this in 1961. Three years later the byte was fixed at eight bits with this term absent.</div>' +
            '</div>' +
          '</div>' +
          '<div class="wgt-panel">' +
            '<div class="wgt-p-title">Encoding Updates Have Been Done Before</div>' +
            '<div class="wgt-proof-hero">' +
              '<div class="wgt-ph-tag">Precedent · 1993</div>' +
              '<div class="wgt-ph-head">The encoding has already been replaced once.</div>' +
              '<div class="wgt-ph-body">In 1993, <b>Unicode replaced ASCII</b> in Windows NT 3.1. IBM, Microsoft, Apple, Sun agreed to move off the fixed 8-bit scheme.</div>' +
            '</div>' +
            '<div class="wgt-deploy-hero">' +
              '<div class="wgt-dh-tag">Deployable Now · 2026</div>' +
              '<div class="wgt-dh-head">P30 can start deploying immediately.</div>' +
              '<div class="wgt-dh-body">The same kind of encoding update can begin now to address the <b>water, energy, and heat crisis</b>.</div>' +
            '</div>' +
            '<div class="wgt-takeaway">Six redefinitions across seven decades. The 8-bit byte was the fourth, not the last. <b>P30 is the next.</b></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return { destroy: function () { root.innerHTML = ''; } };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.history = { mount: mountHistory };
})(window);
