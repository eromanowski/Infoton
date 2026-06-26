(function (global) {
  'use strict';

  var THERAPIES = [
    {
      title: 'Ketogenic therapy',
      body: 'Shifts metabolism away from glycolysis, starving cancer cells while restoring mitochondrial function.',
    },
    {
      title: 'Hyperbaric oxygen (HBOT)',
      body: 'Increases cellular oxygenation without inducing ROS damage. Do not perform without PEMF.',
    },
    {
      title: 'PEMF (10–50 Hz)',
      body: 'Stimulates mitochondrial ATP production while stabilizing function post-damage. 3–5× per week or as prescribed.',
    },
    {
      title: 'Mitochondrial support',
      body: 'NAD+, CoQ10, ALA, L-Carnitine, magnesium, PQQ, melatonin — rebuild energy pathways and counter chemo-induced damage.',
    },
  ];

  function fmtTau(ps) {
    if (ps <= 0) return '—';
    if (ps < 1) return ps.toFixed(2) + ' ps';
    return ps.toFixed(1) + ' ps';
  }

  function mountMitochondria(root) {
    var core = global.P30MitoCore;
    if (!core) {
      root.innerHTML = '<div class="demo-error">Mitochondria core failed to load.</div>';
      return { destroy: function () { root.innerHTML = ''; } };
    }

    var listeners = [];
    function on(el, ev, fn) {
      el.addEventListener(ev, fn);
      listeners.push([el, ev, fn]);
    }

    var therapyHtml = THERAPIES.map(function (t) {
      return (
        '<div class="wgt-mito-care">' +
          '<div class="wgt-mito-care-title">' + t.title + '</div>' +
          '<div class="wgt-mito-care-body">' + t.body + '</div>' +
        '</div>'
      );
    }).join('');

    root.innerHTML =
      '<div class="wgt wgt-mito">' +
        '<div class="wgt-stage wgt-stage-mito">' +
          '<div class="wgt-work">' +
            '<div class="wgt-work-head">' +
              '<div class="wgt-work-title">Virtual Mitochondria Calculator</div>' +
              '<div class="wgt-work-tag" data-wgt="stateBadge">HEALTHY</div>' +
            '</div>' +
            '<div class="wgt-mito-hero">' +
              '<div class="wgt-mito-psi">' +
                '<label class="wgt-mito-lab" for="wgt-mito-slider">Membrane potential Δψ<sub>m</sub></label>' +
                '<div class="wgt-mito-psi-row">' +
                  '<input type="range" id="wgt-mito-slider" data-wgt="slider" min="80" max="260" step="1" value="150">' +
                  '<span class="wgt-mito-psi-val"><span data-wgt="psiVal">150</span> mV</span>' +
                '</div>' +
                '<div class="wgt-mito-scale"><span>80 mV</span><span>145–155 healthy</span><span>260 mV</span></div>' +
              '</div>' +
              '<div class="wgt-mito-coh">' +
                '<div class="wgt-mito-coh-head"><span>Coherence (τ / τ<sub>healthy</sub>)</span><span data-wgt="tauReadout">0.28 ps</span></div>' +
                '<div class="wgt-mito-coh-track"><div class="wgt-mito-coh-fill" data-wgt="cohFill"></div></div>' +
              '</div>' +
            '</div>' +
            '<div class="wgt-mito-grid">' +
              '<div class="wgt-mito-metric"><span class="wgt-mito-k">ν (THz)</span><span class="wgt-mito-v" data-wgt="nu">36</span></div>' +
              '<div class="wgt-mito-metric"><span class="wgt-mito-k">λ (μm)</span><span class="wgt-mito-v" data-wgt="lambda">8</span></div>' +
              '<div class="wgt-mito-metric"><span class="wgt-mito-k">T<sub>Wien</sub> (K)</span><span class="wgt-mito-v" data-wgt="tWien">351</span></div>' +
              '<div class="wgt-mito-metric"><span class="wgt-mito-k">ΔT (K)</span><span class="wgt-mito-v" data-wgt="deltaT">28</span></div>' +
              '<div class="wgt-mito-metric biomarker"><span class="wgt-mito-k">ATP (rel.)</span><span class="wgt-mito-v" data-wgt="atp">2</span></div>' +
              '<div class="wgt-mito-metric biomarker"><span class="wgt-mito-k">ROS (rel.)</span><span class="wgt-mito-v" data-wgt="ros">1</span></div>' +
              '<div class="wgt-mito-metric biomarker"><span class="wgt-mito-k">VO₂ (rel.)</span><span class="wgt-mito-v" data-wgt="vo2">1</span></div>' +
              '<div class="wgt-mito-metric"><span class="wgt-mito-k">Infoton mass</span><span class="wgt-mito-v sm" data-wgt="infoton">—</span></div>' +
            '</div>' +
            '<p class="wgt-mito-desc" data-wgt="stateDesc"></p>' +
            '<div class="wgt-caption">Δψ<sub>m</sub> from JC-1 assays drives the quantum → thermodynamic → biomarker chain. Not medical advice — precision education tool.</div>' +
          '</div>' +
          '<div class="wgt-panel">' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-p-title">Equation Chain</div>' +
              '<div class="wgt-deriv wgt-mito-deriv">' +
                '<div class="wgt-dstep"><span class="wgt-dnum">1</span><div class="wgt-dbody"><span class="wgt-dmath">E = e · Δψ<sub>m</sub></span></div></div>' +
                '<div class="wgt-dstep"><span class="wgt-dnum">2</span><div class="wgt-dbody"><span class="wgt-dmath">ω = E / ℏ, &nbsp; ν = ω / 2π, &nbsp; λ = c / ν</span></div></div>' +
                '<div class="wgt-dstep"><span class="wgt-dnum">3</span><div class="wgt-dbody"><span class="wgt-dmath">T = W / λ &nbsp; (Wien), &nbsp; ΔT = T − T<sub>bath</sub></span></div></div>' +
                '<div class="wgt-dstep"><span class="wgt-dnum">4</span><div class="wgt-dbody"><span class="wgt-dmath">τ = ℏ / (k<sub>B</sub> · ΔT)</span></div></div>' +
                '<div class="wgt-dstep"><span class="wgt-dnum">5</span><div class="wgt-dbody"><span class="wgt-dmath">ATP = max(0.5, 2.5·τ<sub>ratio</sub>²), &nbsp; ROS = min(100, 1/τ<sub>ratio</sub>²)</span></div></div>' +
              '</div>' +
            '</div>' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-p-title">Care Pathways (adjunct)</div>' +
              therapyHtml +
            '</div>' +
            '<div class="wgt-p-block">' +
              '<div class="wgt-p-title">Research</div>' +
              '<p class="wgt-mito-ref">Virtual Mitochondria maps biomarkers to an Infoton stability score — conventional treatment restoring coherence vs accelerating collapse.</p>' +
              '<a class="wgt-mito-link" href="https://zenodo.org/records/18373065" target="_blank" rel="noopener">Zenodo 18373065 →</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    function q(name) {
      return root.querySelector('[data-wgt="' + name + '"]');
    }

    function setText(name, text) {
      var el = q(name);
      if (el) el.textContent = text;
    }

    function apply(r) {
      setText('psiVal', String(Math.round(r.psiMmV)));
      setText('nu', r.nuThz.toFixed(0));
      setText('lambda', r.wavelengthUm.toFixed(0));
      setText('tWien', r.tWienK.toFixed(0));
      setText('deltaT', r.deltaTK.toFixed(0));
      setText('atp', r.atp.toFixed(0));
      setText('ros', r.ros.toFixed(0));
      setText('vo2', r.vo2.toFixed(2));
      setText('infoton', r.infotonMass.toExponential(1) + ' kg');
      setText('tauReadout', fmtTau(r.tauCohPs) + ' · ratio ' + r.tauRatio.toFixed(2));
      setText('stateDesc', r.state.description);

      var badge = q('stateBadge');
      if (badge) {
        badge.textContent = r.state.display;
        badge.className = 'wgt-work-tag wgt-mito-state ' + r.state.cls;
      }

      var fill = q('cohFill');
      if (fill) fill.style.width = Math.min(r.tauRatio * 100, 100) + '%';
    }

    function updateFromPsi(psi) {
      apply(core.calculate(psi));
    }

    var slider = q('slider');
    on(slider, 'input', function () {
      updateFromPsi(parseFloat(slider.value));
    });

    updateFromPsi(150);

    return {
      destroy: function () {
        listeners.forEach(function (pair) {
          pair[0].removeEventListener(pair[1], pair[2]);
        });
        root.innerHTML = '';
      },
    };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.mitochondria = { mount: mountMitochondria };
})(window);
