#!/usr/bin/env python3
"""Generate spec/mitochondria_vectors.json from the Python core (source of truth).

The vectors are the cross-implementation contract: any port (the JS core, or a
third-party reimplementation in a virtual-cell pipeline) must reproduce every
field within `tolerance.rel`. Regenerate whenever the model or constants change,
then bump MODEL_VERSION.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from mitochondria_core import (  # noqa: E402
    CONSTANTS_TAG,
    MODEL,
    MODEL_VERSION,
    calculate,
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
    snapshot,
)

FORWARD_PSI = [100, 138.2, 143, 145, 150, 155, 160, 165, 180, 200, 220]

INVERSE_PSI = 150.0


def build() -> dict:
    r = calculate(INVERSE_PSI)
    inverse = [
        {"fn": "psi_from_energy_j", "input": r.energy_j, "psi_mmV": psi_from_energy_j(r.energy_j)},
        {"fn": "psi_from_omega_rad_s", "input": r.omega_rad_s, "psi_mmV": psi_from_omega_rad_s(r.omega_rad_s)},
        {"fn": "psi_from_nu_thz", "input": r.nu_thz, "psi_mmV": psi_from_nu_thz(r.nu_thz)},
        {"fn": "psi_from_wavelength_um", "input": r.wavelength_um, "psi_mmV": psi_from_wavelength_um(r.wavelength_um)},
        {"fn": "psi_from_t_wien_k", "input": r.t_wien_k, "psi_mmV": psi_from_t_wien_k(r.t_wien_k)},
        {"fn": "psi_from_delta_t_k", "input": r.delta_t_k, "psi_mmV": psi_from_delta_t_k(r.delta_t_k)},
        {"fn": "psi_from_tau_coh_ps", "input": r.tau_coh_ps, "psi_mmV": psi_from_tau_coh_ps(r.tau_coh_ps)},
        {"fn": "psi_from_infoton_mass_kg", "input": r.infoton_mass_kg, "psi_mmV": psi_from_infoton_mass_kg(r.infoton_mass_kg)},
        {"fn": "psi_from_atp", "input": r.atp, "psi_mmV": psi_from_atp(r.atp)},
        {"fn": "psi_from_ros", "input": r.ros, "psi_mmV": psi_from_ros(r.ros)},
        {"fn": "psi_from_vo2", "input": r.vo2, "psi_mmV": psi_from_vo2(r.vo2)},
    ]
    return {
        "model": MODEL,
        "model_version": MODEL_VERSION,
        "constants": CONSTANTS_TAG,
        "generated_by": "tools/gen_mitochondria_vectors.py",
        "schema": "spec/mitochondria.schema.json",
        "tolerance": {"rel": 1e-9, "psi_abs_mV": 1e-6},
        "forward": [{"psi_mmV": psi, "snapshot": snapshot(psi)} for psi in FORWARD_PSI],
        "inverse": inverse,
    }


def main() -> None:
    out = ROOT / "spec" / "mitochondria_vectors.json"
    out.write_text(json.dumps(build(), indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({len(FORWARD_PSI)} forward, {len(build()['inverse'])} inverse vectors)")


if __name__ == "__main__":
    main()
