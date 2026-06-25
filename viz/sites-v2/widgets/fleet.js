(function (global) {
  'use strict';

  function mountFleet(root) {
    var listeners = [];

    function on(el, ev, fn) {
      el.addEventListener(ev, fn);
      listeners.push([el, ev, fn]);
    }

    root.innerHTML =
      '<div class="wgt wgt-fleet">' +
        '<div class="wgt-stage wgt-stage-fleet">' +
          '<div class="wgt-work">' +
            '<div class="wgt-work-head">' +
              '<div class="wgt-region-tabs">' +
                '<button type="button" class="wgt-rtab active" data-wgt="tabUS">United States · 5,500</button>' +
                '<button type="button" class="wgt-rtab" data-wgt="tabGlobal">Global · 11,800</button>' +
                '<button type="button" class="wgt-rtab" data-wgt="tabUtah">Utah · 13 reactors</button>' +
              '</div>' +
              '<div class="wgt-work-tag" data-wgt="workTag">0 GW saved</div>' +
            '</div>' +
            '<div class="wgt-deploy">' +
              '<div class="wgt-deploy-top">' +
                '<span class="wgt-deploy-lab">Data centers converted to Infoton P30</span>' +
                '<span class="wgt-deploy-val"><span data-wgt="dCount">0</span><small data-wgt="dPct">0% of fleet</small></span>' +
              '</div>' +
              '<input type="range" data-wgt="slider" min="0" max="100" step="1" value="0">' +
              '<div class="wgt-deploy-scale"><span>0 converted</span><span data-wgt="scaleMax">5,500 converted</span></div>' +
            '</div>' +
            '<div class="wgt-fleetbar-wrap">' +
              '<div class="wgt-fleetbar-lab"><span class="wgt-fbl-l">Fleet power demand</span><span class="wgt-fbl-r" data-wgt="fleetReadout"></span></div>' +
              '<div class="wgt-fleet-track">' +
                '<div class="wgt-fseg-byte" data-wgt="segByte"><span class="wgt-fseg-lab" data-wgt="lblByte"></span></div>' +
                '<div class="wgt-fseg-p30" data-wgt="segP30"><span class="wgt-fseg-lab" data-wgt="lblP30"></span></div>' +
                '<div class="wgt-fseg-saved" data-wgt="segSaved"><span class="wgt-fseg-lab" data-wgt="lblSaved"></span></div>' +
              '</div>' +
              '<div class="wgt-legend">' +
                '<span><span class="wgt-dot byte"></span>byte demand</span>' +
                '<span><span class="wgt-dot p30"></span>P30 demand</span>' +
                '<span><span class="wgt-dot saved"></span>demand eliminated</span>' +
              '</div>' +
            '</div>' +
            '<div class="wgt-react-block">' +
              '<div class="wgt-react-head"><span class="wgt-react-t">Reactors avoided (300 MW SMR each)</span><span class="wgt-react-n" data-wgt="reactN">0</span></div>' +
              '<div class="wgt-react-grid" data-wgt="reactGrid"></div>' +
              '<div class="wgt-react-cap" data-wgt="reactCap">Each block is one 300 MW SMR that no longer needs to be built.</div>' +
            '</div>' +
            '<div class="wgt-react-block">' +
              '<div class="wgt-react-head"><span class="wgt-react-t">Waste heat ejection stopped</span><span class="wgt-react-n wgt-heat-n" data-wgt="heatN">0 GW</span></div>' +
              '<div class="wgt-heatbar-track"><div class="wgt-heatbar-fill" data-wgt="heatFill"></div></div>' +
            '</div>' +
            '<div class="wgt-caption" data-wgt="caption">At 0% conversion the fleet runs entirely on the byte. Drag the slider.</div>' +
          '</div>' +
          '<div class="wgt-panel">' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-p-title">Reactors Needed for This Demand</div>' +
              '<div class="wgt-big"><span class="wgt-big-lab" data-wgt="bigLab">United States</span><span class="wgt-big-val" data-wgt="bigVal">0</span><span class="wgt-big-sub" data-wgt="bigSub">all proposed reactors avoided</span></div>' +
            '</div>' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-p-title">At This Deployment Level</div>' +
              '<div class="wgt-row"><span class="wgt-r-name">Converted</span><span class="wgt-r-val neu" data-wgt="roConv">0</span></div>' +
              '<div class="wgt-row"><span class="wgt-r-name">Fleet demand now</span><span class="wgt-r-val byte" data-wgt="roDemand">20.9 GW</span></div>' +
              '<div class="wgt-row"><span class="wgt-r-name">Demand eliminated</span><span class="wgt-r-val p30" data-wgt="roSaved">0 GW</span></div>' +
              '<div class="wgt-row"><span class="wgt-r-name">Energy avoided / yr</span><span class="wgt-r-val p30" data-wgt="roTWh">0 TWh</span></div>' +
              '<div class="wgt-row"><span class="wgt-r-name">SMRs avoided</span><span class="wgt-r-val p30" data-wgt="roSMR">0</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var E_RATIO = 25.08;
    var AVG_BYTE = 3.80;
    var AVG_P30 = 3.80 / 25.08;
    var SAVED_PER = AVG_BYTE - AVG_P30;
    var SMR = 300;
    var GWR = 1000;
    var hours = 8760;
    var FLEETS = {
      US: { n: 5500, name: 'United States' },
      GLOBAL: { n: 11800, name: 'Global' },
      UTAH: { name: 'Utah', isUtah: true, dcLoadMW: 3900, reactors: 13, galPerMWyr: 3.5e6 },
    };
    var region = 'US';

    function q(name) {
      return root.querySelector('[data-wgt="' + name + '"]');
    }

    function fmtGW(mw) {
      return mw >= 1000 ? (mw / 1000).toFixed(1) + ' GW' : mw.toFixed(0) + ' MW';
    }

    function setText(name, text) {
      var el = q(name);
      if (el) el.textContent = text;
    }

    function setHtml(name, html) {
      var el = q(name);
      if (el) el.innerHTML = html;
    }

    function setWidth(name, pct) {
      var el = q(name);
      if (el) el.style.width = pct + '%';
    }

    function update() {
      var f = FLEETS[region];
      var d = parseInt(q('slider').value, 10) / 100;

      if (f.isUtah) {
        var loadMW = f.dcLoadMW;
        var p30LoadMW = (loadMW / 1.4) / E_RATIO * 1.4;
        var savedFull = loadMW - p30LoadMW;
        var saved = savedFull * d;
        var P_byte = loadMW - d * loadMW;
        var P_p30 = d * p30LoadMW;
        var totalNow = P_byte + P_p30;
        var baseline = loadMW;
        var WU = function (mw) { return (mw / baseline * 100); };

        setText('dCount', (d * 100).toFixed(0) + '%');
        setText('dPct', 'of Utah DC load');
        setText('scaleMax', '100% converted');
        setText('workTag', fmtGW(saved) + ' saved');
        setText('fleetReadout', fmtGW(totalNow) + ' now · ' + fmtGW(saved) + ' removed');
        setWidth('segByte', WU(P_byte));
        setWidth('segP30', Math.max(WU(P_p30), P_p30 > 0 ? 1.5 : 0));
        setWidth('segSaved', WU(saved));
        setText('lblByte', WU(P_byte) > 14 ? fmtGW(P_byte) : '');
        setText('lblP30', WU(P_p30) > 10 ? fmtGW(P_p30) : '');
        setText('lblSaved', WU(saved) > 14 ? fmtGW(saved) + ' gone' : '');

        var grid = q('reactGrid');
        if (grid.childElementCount !== f.reactors) {
          grid.innerHTML = '';
          for (var i = 0; i < f.reactors; i++) {
            var r = document.createElement('div');
            r.className = 'wgt-react';
            grid.appendChild(r);
          }
        }
        var avoidedR = Math.round(d * f.reactors);
        Array.prototype.forEach.call(grid.children, function (c, idx) {
          c.classList.toggle('avoided', idx < avoidedR);
        });
        setText('reactN', avoidedR + ' of ' + f.reactors);
        setText('roConv', (d * 100).toFixed(0) + '% of 3.9 GW');
        setText('roDemand', fmtGW(totalNow));
        setText('roSaved', fmtGW(saved));
        setText('roTWh', (saved * hours / 1e6).toFixed(0) + ' TWh');
        setText('roSMR', avoidedR + ' of 13');
        setText('heatN', fmtGW(saved));
        q('heatFill').style.width = WU(saved) + '%';
        setText('bigLab', 'Utah, at this deployment');
        setText('bigVal', String(f.reactors - avoidedR));
        return;
      }

      var n = f.n;
      var converted = Math.round(n * d);
      var byteDC = n - converted;
      var P_byte = byteDC * AVG_BYTE;
      var P_p30 = converted * AVG_P30;
      var saved = converted * SAVED_PER;
      var total_byte_baseline = n * AVG_BYTE;
      var totalNow = P_byte + P_p30;
      var W = function (mw) { return (mw / total_byte_baseline * 100); };

      setText('dCount', converted.toLocaleString());
      setText('dPct', (d * 100).toFixed(0) + '% of fleet');
      setText('scaleMax', n.toLocaleString() + ' converted');
      setText('workTag', fmtGW(saved) + ' saved');
      setText('fleetReadout', fmtGW(totalNow) + ' now · ' + fmtGW(saved) + ' removed');
      setWidth('segByte', W(P_byte));
      setWidth('segP30', Math.max(W(P_p30), P_p30 > 0 ? 1.5 : 0));
      setWidth('segSaved', W(saved));
      setText('lblByte', W(P_byte) > 14 ? fmtGW(P_byte) : '');
      setText('lblP30', W(P_p30) > 10 ? fmtGW(P_p30) : '');
      setText('lblSaved', W(saved) > 14 ? fmtGW(saved) + ' gone' : '');

      var grid2 = q('reactGrid');
      var totalSMR = Math.round(total_byte_baseline / SMR);
      var avoidedSMR = Math.round(d * totalSMR);
      var stillNeeded = totalSMR - avoidedSMR;
      if (grid2.childElementCount !== totalSMR) {
        grid2.innerHTML = '';
        for (var j = 0; j < totalSMR; j++) {
          var rr = document.createElement('div');
          rr.className = 'wgt-react';
          grid2.appendChild(rr);
        }
      }
      Array.prototype.forEach.call(grid2.children, function (c, idx) {
        c.classList.toggle('avoided', idx < avoidedSMR);
      });
      setText('reactN', avoidedSMR.toLocaleString() + ' avoided');
      setText('roConv', converted.toLocaleString() + ' / ' + n.toLocaleString());
      setText('roDemand', fmtGW(totalNow));
      setText('roSaved', fmtGW(saved));
      setText('roTWh', (saved * hours / 1e6).toFixed(0) + ' TWh');
      setText('roSMR', Math.round(saved / SMR).toLocaleString());
      setText('heatN', fmtGW(saved));
      q('heatFill').style.width = (saved / total_byte_baseline * 100) + '%';
      setText('bigLab', f.name + ', at this deployment');
      setText('bigVal', stillNeeded.toLocaleString());
      setText('bigSub', stillNeeded === 0 ? 'all proposed reactors avoided' : avoidedSMR.toLocaleString() + ' avoided so far');

      if (d === 0) {
        setHtml('caption', 'At 0% conversion the fleet runs entirely on the byte. Drag the slider: every converted data center drops to <b>1/25th</b> of its draw.');
      } else if (d >= 1) {
        setHtml('caption', 'Full conversion: demand falls by <b>' + fmtGW(saved) + '</b>, <b>' + avoidedSMR + ' SMRs</b> never built.');
      } else {
        setHtml('caption', '<b>' + converted.toLocaleString() + '</b> converted. Demand eliminated: <b>' + fmtGW(saved) + '</b>.');
      }
    }

    function setRegion(r) {
      region = r;
      root.querySelectorAll('.wgt-rtab').forEach(function (tab) {
        tab.classList.remove('active');
      });
      var tabId = r === 'US' ? 'tabUS' : r === 'GLOBAL' ? 'tabGlobal' : 'tabUtah';
      q(tabId).classList.add('active');
      update();
    }

    on(q('slider'), 'input', update);
    on(q('tabUS'), 'click', function () { setRegion('US'); });
    on(q('tabGlobal'), 'click', function () { setRegion('GLOBAL'); });
    on(q('tabUtah'), 'click', function () { setRegion('UTAH'); });
    update();

    return {
      destroy: function () {
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2]); });
        root.innerHTML = '';
      },
    };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.fleet = { mount: mountFleet };
})(window);
