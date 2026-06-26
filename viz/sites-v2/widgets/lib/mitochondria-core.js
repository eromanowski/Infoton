(function (global) {
  'use strict';

  var E = 1.602176634e-19;
  var H = 1.054571817e-34;
  var C = 299792458;
  var KB = 1.380649e-23;
  var WIEN = 2.897771955e-3;
  var T_BATH = 323.0;
  var TAU_HEALTHY = 0.279e-12;
  var LN2 = Math.log(2);

  var STATES = {
    DYSREGULATED: {
      id: 'DYSREGULATED',
      display: 'DYSREGULATED',
      cls: 'state-dys',
      description:
        'Severely depressed membrane potential. Coherence threshold breached. ATP synthesis compromised. High ROS generation.',
    },
    HEALTHY: {
      id: 'HEALTHY',
      display: 'HEALTHY',
      cls: 'state-healthy',
      description:
        'Optimal quantum coherence with ~27 K gap. Peak ATP efficiency. Minimal ROS. Baseline metabolic state.',
    },
    MILD_HYPERPOLARIZED: {
      id: 'MILD_HYPERPOLARIZED',
      display: 'MILD HYPERPOLARIZATION',
      cls: 'state-mild',
      description:
        'Elevated membrane potential. Increased coherence gap. Moderately enhanced metabolic demand.',
    },
    PATHOLOGICAL: {
      id: 'PATHOLOGICAL',
      display: 'PATHOLOGICAL',
      cls: 'state-path',
      description:
        'Significant hyperpolarization. Coherence severely compromised. ATP production suppressed. ROS elevation.',
    },
    CANCER: {
      id: 'CANCER',
      display: 'CANCER-ASSOCIATED',
      cls: 'state-cancer',
      description:
        'Extreme hyperpolarization (220 mV canonical). Coherence time collapsed. ROS elevated. ATP output suppressed.',
    },
  };

  function classifyState(psiMmV) {
    if (psiMmV < 145) return STATES.DYSREGULATED;
    if (psiMmV <= 155) return STATES.HEALTHY;
    if (psiMmV <= 165) return STATES.MILD_HYPERPOLARIZED;
    if (psiMmV <= 200) return STATES.PATHOLOGICAL;
    return STATES.CANCER;
  }

  function psiFromOmega(omega) {
    return (omega * H / E) * 1000;
  }

  function chainFromOmega(omega) {
    return psiFromOmega(omega);
  }

  function psiFromNuThz(nuThz) {
    return chainFromOmega(nuThz * 1e12 * 2 * Math.PI);
  }

  function psiFromWavelengthUm(wavelengthUm) {
    var wavelengthM = wavelengthUm / 1e6;
    var nuHz = C / wavelengthM;
    return chainFromOmega(nuHz * 2 * Math.PI);
  }

  function psiFromTWien(tWienK) {
    var wavelengthM = WIEN / tWienK;
    var nuHz = C / wavelengthM;
    return chainFromOmega(nuHz * 2 * Math.PI);
  }

  function psiFromDeltaT(deltaTK) {
    return psiFromTWien(deltaTK + T_BATH);
  }

  function psiFromTauPs(tauPs) {
    var tauS = tauPs * 1e-12;
    var deltaTK = H / (KB * tauS);
    return psiFromDeltaT(deltaTK);
  }

  function psiFromInfotonMass(massKg) {
    var tWien = (massKg * C * C) / (KB * LN2);
    return psiFromTWien(tWien);
  }

  function psiFromAtp(atp) {
    var tauRatio = Math.sqrt(atp / 2.5);
    var tauS = tauRatio * TAU_HEALTHY;
    var deltaTK = H / (KB * tauS);
    return psiFromDeltaT(deltaTK);
  }

  function psiFromRos(ros) {
    var tauRatio = 1 / Math.sqrt(ros);
    var tauS = tauRatio * TAU_HEALTHY;
    var deltaTK = H / (KB * tauS);
    return psiFromDeltaT(deltaTK);
  }

  function psiFromVo2(vo2) {
    var tauS = vo2 * TAU_HEALTHY;
    var deltaTK = H / (KB * tauS);
    return psiFromDeltaT(deltaTK);
  }

  function calculate(psiMmV) {
    var psiMv = psiMmV / 1000;
    var energyJ = E * psiMv;
    var omegaRadS = energyJ / H;
    var nuHz = omegaRadS / (2 * Math.PI);
    var wavelengthM = C / nuHz;
    var nuThz = nuHz / 1e12;
    var wavelengthUm = wavelengthM * 1e6;
    var tWienK = WIEN / wavelengthM;
    var deltaTK = tWienK - T_BATH;
    var infotonMass = (KB * tWienK * LN2) / (C * C);
    var tauCohS = deltaTK > 0 ? H / (KB * deltaTK) : 0;
    var tauCohPs = tauCohS * 1e12;
    var healthyPs = TAU_HEALTHY * 1e12;
    var tauRatio = tauCohPs > 0 ? tauCohPs / healthyPs : 0;
    var vo2 = Math.max(0.05, tauRatio);
    var atp = Math.max(0.5, 2.5 * tauRatio * tauRatio);
    var ros = Math.min(100, tauRatio > 0 ? (1 / tauRatio) * (1 / tauRatio) : 100);
    var energyThermalJ = KB * deltaTK;
    var state = classifyState(psiMmV);

    return {
      psiMmV: psiMmV,
      energyJ: energyJ,
      omegaRadS: omegaRadS,
      nuHz: nuHz,
      nuThz: nuThz,
      wavelengthM: wavelengthM,
      wavelengthUm: wavelengthUm,
      tWienK: tWienK,
      deltaTK: deltaTK,
      infotonMass: infotonMass,
      tauCohS: tauCohS,
      tauCohPs: tauCohPs,
      tauRatio: tauRatio,
      vo2: vo2,
      atp: atp,
      ros: ros,
      energyThermalJ: energyThermalJ,
      state: state,
    };
  }

  global.P30MitoCore = {
    constants: {
      E: E,
      H: H,
      C: C,
      KB: KB,
      WIEN: WIEN,
      T_BATH: T_BATH,
      TAU_HEALTHY: TAU_HEALTHY,
    },
    STATES: STATES,
    calculate: calculate,
    classifyState: classifyState,
    psiFromEnergy: function (j) { return (j / E) * 1000; },
    psiFromOmega: psiFromOmega,
    psiFromNuThz: psiFromNuThz,
    psiFromWavelengthUm: psiFromWavelengthUm,
    psiFromTWien: psiFromTWien,
    psiFromDeltaT: psiFromDeltaT,
    psiFromTauPs: psiFromTauPs,
    psiFromInfotonMass: psiFromInfotonMass,
    psiFromAtp: psiFromAtp,
    psiFromRos: psiFromRos,
    psiFromVo2: psiFromVo2,
  };
})(window);
