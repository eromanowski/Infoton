#!/usr/bin/env python3
"""Verify Virtual Mitochondria calculator against golden values from infoton.ai embed."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from mitochondria_core import (  # noqa: E402
    calculate,
    classify_state,
    psi_from_atp,
    psi_from_delta_t_k,
    psi_from_energy_j,
    psi_from_infoton_mass_kg,
    psi_from_nu_thz,
    psi_from_omega_rad_s,
    psi_from_ros,
    psi_from_t_wien_k,
    psi_from_tau_coh_ps,
    psi_from_vo2,
    psi_from_wavelength_um,
)


def approx(got: float, want: float, tol: float) -> bool:
    return abs(got - want) <= tol


def main() -> None:
    ok = True

    r150 = calculate(150.0)
    checks_150 = [
        ("energy_j", r150.energy_j, 2.403265e-20, 1e-25),
        ("nu_thz", r150.nu_thz, 36.27, 0.05),
        ("wavelength_um", r150.wavelength_um, 8.3, 0.1),
        ("t_wien_k", r150.t_wien_k, 350.6, 0.2),
        ("delta_t_k", r150.delta_t_k, 27.58, 0.05),
        ("tau_coh_ps", r150.tau_coh_ps, 0.277, 0.01),
        ("tau_ratio", r150.tau_ratio, 0.993, 0.01),
        ("atp", r150.atp, 2.46, 0.05),
        ("ros", r150.ros, 1.01, 0.05),
        ("vo2", r150.vo2, 0.99, 0.02),
        ("state", r150.state_id, "HEALTHY", 0),
    ]

    state_cases = [
        (100, "DYSREGULATED"),
        (145, "HEALTHY"),
        (155, "HEALTHY"),
        (160, "MILD_HYPERPOLARIZED"),
        (180, "PATHOLOGICAL"),
        (220, "CANCER"),
    ]

    print("=== Virtual Mitochondria verification ===")
    for name, got, want, tol in checks_150:
        if name == "state":
            match = got == want
        else:
            match = approx(got, want, tol)
        ok &= match
        print(f"  psi=150 {name}: {got} (want {want}) {'OK' if match else 'FAIL'}")

    for psi, want_state in state_cases:
        got = classify_state(psi)
        match = got == want_state
        ok &= match
        print(f"  classify({psi}): {got} (want {want_state}) {'OK' if match else 'FAIL'}")

    r100 = calculate(100.0)
    ok &= r100.tau_coh_s == 0.0
    ok &= approx(r100.atp, 0.5, 1e-9)
    ok &= approx(r100.ros, 100.0, 1e-9)
    ok &= approx(r100.vo2, 0.05, 1e-9)
    print(f"  psi=100 depressed biomarkers: {'OK' if ok else 'FAIL'}")

    inverses = [
        ("energy", psi_from_energy_j(r150.energy_j)),
        ("omega", psi_from_omega_rad_s(r150.omega_rad_s)),
        ("nu_thz", psi_from_nu_thz(r150.nu_thz)),
        ("lambda_um", psi_from_wavelength_um(r150.wavelength_um)),
        ("t_wien", psi_from_t_wien_k(r150.t_wien_k)),
        ("delta_t", psi_from_delta_t_k(r150.delta_t_k)),
        ("tau_ps", psi_from_tau_coh_ps(r150.tau_coh_ps)),
        ("infoton", psi_from_infoton_mass_kg(r150.infoton_mass_kg)),
        ("atp", psi_from_atp(r150.atp)),
        ("ros", psi_from_ros(r150.ros)),
        ("vo2", psi_from_vo2(r150.vo2)),
    ]
    for label, psi_back in inverses:
        match = approx(psi_back, 150.0, 0.5)
        ok &= match
        print(f"  inverse {label}: {psi_back:.2f} mV {'OK' if match else 'FAIL'}")

    print()
    print(f"Overall: {'PASS' if ok else 'FAIL'}")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
