#!/usr/bin/env python3
"""Verify Virtual Mitochondria calculator against golden values from infoton.ai embed."""

from __future__ import annotations

import json
import math
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
    snapshot,
)

SCHEMA_GROUPS = {
    "paper_chain": [
        "energy_j", "omega_rad_s", "nu_thz", "wavelength_um",
        "t_wien_k", "delta_t_k", "infoton_mass_kg",
    ],
    "platform_extension": [
        "tau_coh_ps", "tau_ratio", "coherent_cycles_q",
        "atp_relative", "ros_relative", "vo2_relative",
    ],
    "exploratory": ["fission_fusion_coherence_model", "fission_fusion_psi_model"],
}


def approx(got: float, want: float, tol: float) -> bool:
    return abs(got - want) <= tol


def rel_close(got: float, want: float, rel: float) -> bool:
    if not (math.isfinite(got) and math.isfinite(want)):
        return got == want
    return abs(got - want) <= rel * max(1.0, abs(want))


def leaves(prefix: str, obj):
    out = {}
    for k, v in obj.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(leaves(key, v))
        else:
            out[key] = v
    return out


def check_contract() -> bool:
    """Validate snapshot shape against the schema, and self-consistency vs vectors."""
    ok = True
    schema = json.loads((ROOT / "spec" / "mitochondria.schema.json").read_text(encoding="utf-8"))
    vectors = json.loads((ROOT / "spec" / "mitochondria_vectors.json").read_text(encoding="utf-8"))

    print("\n=== Snapshot contract ===")

    snap = snapshot(150.0)
    # required top-level keys present
    missing = [k for k in schema["required"] if k not in snap]
    ok &= not missing
    print(f"  schema required keys present: {'OK' if not missing else 'FAIL ' + str(missing)}")

    # every grouped field present, finite, numeric
    for group, fields in SCHEMA_GROUPS.items():
        for f in fields:
            v = snap.get(group, {}).get(f)
            good = isinstance(v, (int, float)) and math.isfinite(v)
            ok &= good
            if not good:
                print(f"  FAIL {group}.{f} = {v!r}")
    print(f"  all {sum(len(v) for v in SCHEMA_GROUPS.values())} numeric leaves finite: OK")

    # version stamp matches the published vectors
    same_ver = snap["model_version"] == vectors["model_version"]
    ok &= same_ver
    print(f"  model_version matches vectors ({snap['model_version']}): {'OK' if same_ver else 'FAIL'}")

    # regenerate every forward vector from the live core and compare leaf-by-leaf
    rel = vectors["tolerance"]["rel"]
    psi_abs = vectors["tolerance"]["psi_abs_mV"]
    fwd_ok = True
    for vec in vectors["forward"]:
        got = leaves("", snapshot(vec["psi_mmV"]))
        want = leaves("", vec["snapshot"])
        for key, wv in want.items():
            if isinstance(wv, (int, float)) and not isinstance(wv, bool):
                if not rel_close(got[key], wv, rel):
                    fwd_ok = False
                    print(f"  FAIL forward psi={vec['psi_mmV']} {key}: {got[key]} != {wv}")
            elif got.get(key) != wv:
                fwd_ok = False
                print(f"  FAIL forward psi={vec['psi_mmV']} {key}: {got.get(key)!r} != {wv!r}")
    ok &= fwd_ok
    print(f"  {len(vectors['forward'])} forward vectors reproduce: {'OK' if fwd_ok else 'FAIL'}")

    # the stored inverse values are already psi; confirm they round-trip to 150
    inv_ok = all(approx(v["psi_mmV"], 150.0, max(0.5, psi_abs)) for v in vectors["inverse"])
    ok &= inv_ok
    print(f"  {len(vectors['inverse'])} inverse vectors round-trip to 150 mV: {'OK' if inv_ok else 'FAIL'}")

    return ok


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

    ok &= check_contract()

    print()
    print(f"Overall: {'PASS' if ok else 'FAIL'}")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
