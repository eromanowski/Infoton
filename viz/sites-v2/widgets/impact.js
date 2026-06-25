(function (global) {
  'use strict';

  function mountImpact(root) {
    root.innerHTML =
      '<div class="wgt wgt-impact">' +
        '<div class="wgt-stage wgt-stage-impact">' +
          '<div class="wgt-work">' +
            '<div class="wgt-work-head">' +
              '<div class="wgt-work-title">Heat Per Rack vs the Air Ceiling</div>' +
              '<div class="wgt-work-tag">130 kW &rarr; 5.18 kW</div>' +
            '</div>' +
            '<div class="wgt-chart">' +
              '<div class="wgt-yaxis" data-wgt="yaxis"></div>' +
              '<div class="wgt-plot">' +
                '<div class="wgt-zone-water" data-wgt="zw"></div>' +
                '<div class="wgt-zone-air" data-wgt="za"></div>' +
                '<div class="wgt-zone-tag wgt-zt-water">water-cooled zone</div>' +
                '<div class="wgt-zone-tag wgt-zt-air">air-cooled zone</div>' +
                '<div class="wgt-gridline" style="bottom:20%"></div>' +
                '<div class="wgt-gridline" style="bottom:40%"></div>' +
                '<div class="wgt-gridline" style="bottom:60%"></div>' +
                '<div class="wgt-gridline" style="bottom:80%"></div>' +
                '<div class="wgt-ceiling" data-wgt="ceiling"><div class="wgt-ceiling-dash"></div>' +
                  '<div class="wgt-ceil-lab"><span class="wgt-cl-1">Air Ceiling</span><span class="wgt-cl-2">~30 kW</span></div></div>' +
                '<div class="wgt-cols">' +
                  '<div class="wgt-colwrap"><div class="wgt-heat byte" data-wgt="heatByte">' +
                    '<div class="wgt-hc"><span class="wgt-hc-name">The Byte</span><span class="wgt-hc-val">130 kW</span><span class="wgt-hc-status">water required</span></div>' +
                  '</div></div>' +
                  '<div class="wgt-colwrap"><div class="wgt-heat p30" data-wgt="heatP30">' +
                    '<div class="wgt-hc"><span class="wgt-hc-name">Infoton P30</span><span class="wgt-hc-val">5.18 kW</span><span class="wgt-hc-status">no water</span></div>' +
                  '</div></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="wgt-caption">The byte\'s column towers <b>4.3&times;</b> above the ceiling. P30 delivers the <b>identical message</b> and never reaches the line.</div>' +
          '</div>' +
          '<div class="wgt-panel">' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-p-title">The Math, Step by Step</div>' +
              '<div class="wgt-deriv">' +
                '<div class="wgt-dstep"><span class="wgt-dnum">1</span><div class="wgt-dbody"><span class="wgt-dmath">Operation ratio = <span class="by">12,264</span> / <span class="pp">489</span> = <span class="hl">25.1&times;</span></span></div></div>' +
                '<div class="wgt-dstep"><span class="wgt-dnum">2</span><div class="wgt-dbody"><span class="wgt-dmath">Power scales linearly: <span class="hl">P = N &times; ops &times; E<sub>op</sub></span></span></div></div>' +
                '<div class="wgt-dstep"><span class="wgt-dnum">3</span><div class="wgt-dbody"><span class="wgt-dmath">P30 rack = <span class="by">130 kW</span> &times; (<span class="pp">489</span> / <span class="by">12,264</span>) = <span class="pp">5.18 kW</span></span></div></div>' +
                '<div class="wgt-dstep"><span class="wgt-dnum">4</span><div class="wgt-dbody"><span class="wgt-dmath">No-water: <span class="pp">5.18 kW</span> &le; <span class="hl">30 kW</span> air ceiling &#10003;</span></div></div>' +
              '</div>' +
            '</div>' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-p-title">Rack Power</div>' +
              '<div class="wgt-big byte"><span class="wgt-big-lab">The Byte</span><span class="wgt-big-val">130 kW</span><span class="wgt-big-sub">4.3&times; over the air ceiling</span></div>' +
              '<div class="wgt-big p30"><span class="wgt-big-lab">Infoton P30</span><span class="wgt-big-val">5.18 kW</span><span class="wgt-big-sub">under the ceiling, air alone</span></div>' +
            '</div>' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-ratio"><div class="wgt-ratio-num">25.1&times;</div>' +
              '<div class="wgt-ratio-cap">fewer operations for the same message — dropping the rack out of the water-cooled regime</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var MAX_KW = 150;
    var CEIL_KW = 30;
    var CEIL_FRAC = CEIL_KW / MAX_KW;

    function q(name) {
      return root.querySelector('[data-wgt="' + name + '"]');
    }

    q('ceiling').style.bottom = (CEIL_FRAC * 100) + '%';
    q('zw').style.bottom = (CEIL_FRAC * 100) + '%';
    q('za').style.top = ((1 - CEIL_FRAC) * 100) + '%';

    var ax = q('yaxis');
    [0, 30, 60, 90, 120, 150].forEach(function (kw) {
      var t = document.createElement('div');
      t.className = 'wgt-ytick';
      t.style.bottom = ((kw / MAX_KW) * 100) + '%';
      t.textContent = kw + ' kW';
      ax.appendChild(t);
    });

    q('heatByte').style.height = ((130 / MAX_KW) * 100) + '%';
    q('heatP30').style.height = Math.max(0.8, (5.18 / MAX_KW) * 100) + '%';

    return { destroy: function () { root.innerHTML = ''; } };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.impact = { mount: mountImpact };
})(window);
