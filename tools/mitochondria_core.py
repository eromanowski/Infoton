"""Virtual Mitochondria calculator — ported from infoton.ai/mitochondria (Quantum Heartbeat)."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

ELEMENTARY_CHARGE = 1.602176634e-19
PLANCK_CONSTANT_REDUCED = 1.054571817e-34
SPEED_OF_LIGHT = 299792458.0
BOLTZMANN_CONSTANT = 1.380649e-23
WIEN_CONSTANT = 2.897771955e-3
DEFAULT_T_BATH = 323.0
HEALTHY_TAU_COH = 0.279e-12
LN2 = math.log(2)

StateId = Literal[
    "DYSREGULATED",
    "HEALTHY",
    "MILD_HYPERPOLARIZED",
    "PATHOLOGICAL",
    "CANCER",
]

STATES: dict[StateId, dict] = {
    "DYSREGULATED": {
        "display": "DYSREGULATED",
        "description": (
            "Severely depressed membrane potential. Coherence threshold breached. "
            "ATP synthesis compromised. High ROS generation."
        ),
    },
    "HEALTHY": {
        "display": "HEALTHY",
        "description": (
            "Optimal quantum coherence with ~27 K gap. Peak ATP efficiency. "
            "Minimal ROS. Baseline metabolic state."
        ),
    },
    "MILD_HYPERPOLARIZED": {
        "display": "MILD HYPERPOLARIZATION",
        "description": (
            "Elevated membrane potential. Increased coherence gap. "
            "Moderately enhanced metabolic demand."
        ),
    },
    "PATHOLOGICAL": {
        "display": "PATHOLOGICAL",
        "description": (
            "Significant hyperpolarization. Coherence severely compromised. "
            "ATP production suppressed. ROS elevation."
        ),
    },
    "CANCER": {
        "display": "CANCER-ASSOCIATED",
        "description": (
            "Extreme hyperpolarization (220 mV canonical). Coherence time collapsed. "
            "ROS elevated. ATP output suppressed."
        ),
    },
}


@dataclass(frozen=True)
class MitoResult:
    psi_mmV: float
    energy_j: float
    omega_rad_s: float
    nu_hz: float
    nu_thz: float
    wavelength_m: float
    wavelength_um: float
    t_wien_k: float
    delta_t_k: float
    infoton_mass_kg: float
    tau_coh_s: float
    tau_coh_ps: float
    tau_ratio: float
    vo2: float
    atp: float
    ros: float
    energy_thermal_j: float
    state_id: StateId


def classify_state(psi_mmV: float) -> StateId:
    if psi_mmV < 145:
        return "DYSREGULATED"
    if psi_mmV <= 155:
        return "HEALTHY"
    if psi_mmV <= 165:
        return "MILD_HYPERPOLARIZED"
    if psi_mmV <= 200:
        return "PATHOLOGICAL"
    return "CANCER"


def calculate(psi_mmV: float) -> MitoResult:
    psi_mv = psi_mmV / 1000.0

    energy_j = ELEMENTARY_CHARGE * psi_mv
    omega_rad_s = energy_j / PLANCK_CONSTANT_REDUCED
    nu_hz = omega_rad_s / (2.0 * math.pi)
    wavelength_m = SPEED_OF_LIGHT / nu_hz
    nu_thz = nu_hz / 1e12
    wavelength_um = wavelength_m * 1e6

    t_wien_k = WIEN_CONSTANT / wavelength_m
    delta_t_k = t_wien_k - DEFAULT_T_BATH

    infoton_mass_kg = (BOLTZMANN_CONSTANT * t_wien_k * LN2) / (SPEED_OF_LIGHT**2)

    tau_coh_s = 0.0
    if delta_t_k > 0:
        tau_coh_s = PLANCK_CONSTANT_REDUCED / (BOLTZMANN_CONSTANT * delta_t_k)

    tau_coh_ps = tau_coh_s * 1e12
    healthy_ps = HEALTHY_TAU_COH * 1e12
    tau_ratio = tau_coh_ps / healthy_ps if tau_coh_ps > 0 else 0.0

    vo2 = max(0.05, tau_ratio)
    atp = max(0.5, 2.5 * (tau_ratio**2))
    ros = min(100.0, (1.0 / tau_ratio) ** 2 if tau_ratio > 0 else 100.0)
    energy_thermal_j = BOLTZMANN_CONSTANT * delta_t_k

    return MitoResult(
        psi_mmV=psi_mmV,
        energy_j=energy_j,
        omega_rad_s=omega_rad_s,
        nu_hz=nu_hz,
        nu_thz=nu_thz,
        wavelength_m=wavelength_m,
        wavelength_um=wavelength_um,
        t_wien_k=t_wien_k,
        delta_t_k=delta_t_k,
        infoton_mass_kg=infoton_mass_kg,
        tau_coh_s=tau_coh_s,
        tau_coh_ps=tau_coh_ps,
        tau_ratio=tau_ratio,
        vo2=vo2,
        atp=atp,
        ros=ros,
        energy_thermal_j=energy_thermal_j,
        state_id=classify_state(psi_mmV),
    )


def psi_from_energy_j(energy_j: float) -> float:
    return (energy_j / ELEMENTARY_CHARGE) * 1000.0


def psi_from_omega_rad_s(omega_rad_s: float) -> float:
    return (omega_rad_s * PLANCK_CONSTANT_REDUCED / ELEMENTARY_CHARGE) * 1000.0


def psi_from_nu_thz(nu_thz: float) -> float:
    omega = nu_thz * 1e12 * 2.0 * math.pi
    return psi_from_omega_rad_s(omega)


def psi_from_wavelength_um(wavelength_um: float) -> float:
    wavelength_m = wavelength_um / 1e6
    nu_hz = SPEED_OF_LIGHT / wavelength_m
    omega = nu_hz * 2.0 * math.pi
    return psi_from_omega_rad_s(omega)


def psi_from_t_wien_k(t_wien_k: float) -> float:
    wavelength_m = WIEN_CONSTANT / t_wien_k
    nu_hz = SPEED_OF_LIGHT / wavelength_m
    omega = nu_hz * 2.0 * math.pi
    return psi_from_omega_rad_s(omega)


def psi_from_delta_t_k(delta_t_k: float) -> float:
    return psi_from_t_wien_k(delta_t_k + DEFAULT_T_BATH)


def psi_from_tau_coh_ps(tau_coh_ps: float) -> float:
    tau_coh_s = tau_coh_ps * 1e-12
    delta_t_k = PLANCK_CONSTANT_REDUCED / (BOLTZMANN_CONSTANT * tau_coh_s)
    return psi_from_delta_t_k(delta_t_k)


def psi_from_infoton_mass_kg(mass_kg: float) -> float:
    t_wien_k = (mass_kg * SPEED_OF_LIGHT**2) / (BOLTZMANN_CONSTANT * LN2)
    return psi_from_t_wien_k(t_wien_k)


def psi_from_atp(atp: float) -> float:
    tau_ratio = math.sqrt(atp / 2.5)
    tau_coh_s = tau_ratio * HEALTHY_TAU_COH
    delta_t_k = PLANCK_CONSTANT_REDUCED / (BOLTZMANN_CONSTANT * tau_coh_s)
    return psi_from_delta_t_k(delta_t_k)


def psi_from_ros(ros: float) -> float:
    tau_ratio = 1.0 / math.sqrt(ros)
    tau_coh_s = tau_ratio * HEALTHY_TAU_COH
    delta_t_k = PLANCK_CONSTANT_REDUCED / (BOLTZMANN_CONSTANT * tau_coh_s)
    return psi_from_delta_t_k(delta_t_k)


def psi_from_vo2(vo2: float) -> float:
    tau_ratio = vo2
    tau_coh_s = tau_ratio * HEALTHY_TAU_COH
    delta_t_k = PLANCK_CONSTANT_REDUCED / (BOLTZMANN_CONSTANT * tau_coh_s)
    return psi_from_delta_t_k(delta_t_k)
