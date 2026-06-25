(function (global) {
  'use strict';

  var REFS = [
    { n: 1, html: '<b>[1]</b> Vopson, M. M. (2019). The mass-energy-information equivalence principle. <i>AIP Advances</i>, 9(9), 095206. <a href="https://doi.org/10.1063/1.5123794">https://doi.org/10.1063/1.5123794</a>', note: 'Proposes information as a distinct form of matter, "the 5th state," alongside solid, liquid, gas, and plasma.' },
    { n: 2, html: '<b>[2]</b> Landauer, R. (1961). Irreversibility and heat generation in the computing process. <i>IBM Journal of Research and Development</i>, 5(3), 183&ndash;191.', note: 'The foundational result that information is physical.' },
    { n: 3, html: '<b>[3]</b> Vopson, M. M. (2019), as above.', note: 'Establishes a finite, quantifiable mass per bit, m = k<sub>B</sub>T ln(2)/c&sup2;.' },
    { n: 4, html: '<b>[4]</b> Hamming, R. W. (1950). Error detecting and error correcting codes. <i>The Bell System Technical Journal</i>, 29(2), 147&ndash;160. <a href="https://doi.org/10.1002/j.1538-7305.1950.tb00463.x">doi</a>', note: 'Stored bits change; detection and correction require redundancy.' },
    { n: 5, html: '<b>[5]</b> B&eacute;rut, A., et al. (2012). Experimental verification of Landauer\'s principle. <i>Nature</i>, 483, 187&ndash;189.', note: 'Confirms the physical link between information operations and thermodynamics.' },
    { n: 6, html: '<b>[6]</b> Bennett, C. H. (1982). The thermodynamics of computation, a review. <i>International Journal of Theoretical Physics</i>, 21(12), 905&ndash;940.', note: 'Logically irreversible operations carry an unavoidable energy cost.' },
    { n: 7, html: '<b>[7]</b> Hong, J., et al. (2016). Experimental test of Landauer\'s principle in single-bit operations. <i>Science Advances</i>. arXiv:1411.6730.', note: 'Measures dissipation consistent with the Landauer limit at 300 K.' },
    { n: 8, html: '<b>[8]</b> Plenio, M. B., &amp; Vitelli, V. (2001). The physics of forgetting. <i>Contemporary Physics</i>, 42(1), 25&ndash;60.', note: 'Erasing information always pays kT ln 2 per bit, dissipated as heat.' },
    { n: 9, html: '<b>[9]</b> Hsiao, M. Y. (1970). A class of optimal minimum odd-weight-column SEC-DED codes. <i>IBM JRD</i>, 14(4), 395&ndash;401.', note: 'Check-bit coverage used in the demo follows Hsiao construction.' },
    { n: 10, html: '<b>[10]</b> Lattice Semiconductor (2012). <i>ECC Module</i>, Reference Design RD1025.', note: 'Published (72,64) SECDED Hsiao parity-check matrix reference.' },
    { n: 11, html: '<b>[11]</b> Sathiamoorthy, M., et al. (2013). XORing elephants. <i>VLDB</i>. arXiv:1301.3791.', note: 'Triple replication vs erasure coding overhead in distributed storage.' },
    { n: 12, html: '<b>[12]</b> Cryptographic number theory: Period-30 wheel. <a href="https://www.primesdemystified.com/abouttheoriginator.html">primesdemystified.com</a>', note: 'Eight residue classes coprime to 30 — coprimality as integrity check.' },
    { n: 13, html: '<b>[13]</b> Garc&iacute;a-Mart&iacute;n, D., et al. (2020). The Prime state and its quantum relatives. <i>Quantum</i>, 4, 371. <a href="https://doi.org/10.22331/q-2020-12-11-371">doi</a>', note: 'Period-30 organization appears in quantum information.' },
  ];

  function mountLearn(root) {
    var items = REFS.map(function (r) {
      return (
        '<li id="ref' + r.n + '">' + r.html +
          (r.note ? '<span class="wgt-refnote">' + r.note + '</span>' : '') +
        '</li>'
      );
    }).join('');

    root.innerHTML =
      '<div class="wgt wgt-learn">' +
        '<div class="wgt-learn-meta">' +
          '<span class="wgt-learn-chip">13 primary sources</span>' +
          '<span class="wgt-learn-chip">102 conformance vectors</span>' +
          '<span class="wgt-learn-chip">Open reproduction</span>' +
        '</div>' +
        '<ol class="wgt-refs-list">' + items + '</ol>' +
        '<p class="wgt-learn-foot">SECDED model: ~582 XOR ops per 64-bit word. Landauer floor E = k<sub>B</sub> T ln(2) ≈ 2.871 zJ/bit @ 300 K.</p>' +
      '</div>';

    return { destroy: function () { root.innerHTML = ''; } };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.learn = { mount: mountLearn };
})(window);
