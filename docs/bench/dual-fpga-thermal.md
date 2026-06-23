# Dual-FPGA thermal bench — P30 vs Hamming

Measure **input power (W)** and **energy per validation (J)** on two identical [Digilent Arty A7-35T](https://digilent.com/shop/arty-a7-35t-fpga-development-board/) boards.

**Publishable claim chain:** [`thermal-claim-chain.md`](thermal-claim-chain.md)

## Two modes

| Mode | Use | Publishable for thermal/power |
|------|-----|------------------------------|
| **MAX** | `START` — full-speed soak | Op model + pass-rate ratio only |
| **RATE** | Host `PASS` at fixed Hz (e.g. 1 Hz) | **Energy per validation**, avg power at matched throughput |

## Emulation (no hardware)

```bash
# Exploratory — pass rate ratio
python tools/soak_emulate.py --mode max

# Publishable chain (steps 4–5 emulated)
python tools/soak_emulate.py --mode rate --rate 1 --duration 10
python tools/thermal_report.py benches/thermal/emulate_rate_*.csv
```

## Hardware — Mode RATE (recommended for publication)

Firmware accepts **`PASS`** (one corpus validation, responds `OK PASS ops=…`).

```bash
python tools/bench_dual_fpga.py \
  --mode rate \
  --rate 1 \
  --p30-port COM3 \
  --hamming-port COM4 \
  --burn-in 1800 \
  --duration 3600

python tools/thermal_report.py benches/thermal/soak_rate_*.csv -o benches/thermal/report.md
```

## Hardware — Mode MAX

```bash
python tools/bench_dual_fpga.py --mode max ...
```

## BOM

| Item | Qty | Notes |
|------|-----|-------|
| Digilent Arty A7-35T | 2 | Identical XC7A35T |
| Adafruit INA260 | 2 | Input power (J = integral of W) |
| Fan jig | 1 | Matched airflow |
| Optional thermocouple | 2 | Step 6 in claim chain |

## Firmware

```bash
python tools/gen_corpus_firmware.py
cd fpga/monitor_rom && make p30_soak hamming_soak
```

| Board | Commands |
|-------|----------|
| P30 | `START LIBRARY`, `PASS`, `STATUS` |
| Hamming | `START`, `PASS`, `STATUS` |

## Protocol (publication)

1. Ambient + fan jig documented  
2. Burn-in 30 min  
3. **RATE:** paired `PASS` at 1 Hz for >= 1 h  
4. Swap boards A/B; repeat  
5. Report via `thermal_report.py` + claim chain checklist  

## Related

- [thermal-claim-chain.md](thermal-claim-chain.md)  
- [ROADMAP](../ROADMAP.md)  
