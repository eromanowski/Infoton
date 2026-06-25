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

| Item | Qty | Est. cost | Notes |
|------|-----|-----------|-------|
| [Digilent Arty A7-35T](https://digilent.com/shop/arty-a7-35t-fpga-development-board/) | 2 | ~\$129 ea | Identical **XC7A35T-1CSG324C** |
| [Adafruit INA260](https://www.adafruit.com/product/4226) | 2 | ~\$15 ea | High-side / inline input power |
| Powered USB 2.0 hub | 1 | ~\$15 | Two Arty USB-UART + headroom |
| 5 V supply (≥ 2 A per board) | 1–2 | ~\$10 | Barrel or bench supply; see wiring |
| Fan + fixed spacer jig | 1 | — | Same distance/CFM on both boards |
| Optional [K-type thermocouple + MAX31855](https://www.adafruit.com/product/269) | 2 | ~\$15 ea | Claim-chain step 6 (ΔT) |

**Alternate FPGA:** [Arty A7-100T](https://digilent.com/shop/arty-a7-100t-fpga-development-board/) if the 35T SoC closes timing tight.

**Rough total:** ~\$320–360 for boards + sensors + hub (excluding optional thermocouples).

### P30 Bench Carrier v1 (recommended for publication)

Orderable dual-module carrier with onboard **INA3221** dual-rail sensing:

- Hardware pack: [`hardware/p30-bench-carrier-v1/`](../../hardware/p30-bench-carrier-v1/)
- 2× **Digilent Cmod A7-35T** on matched 5 V rails (~\$290–420 total with PCBA)
- LiteX: `python fpga/litex/p30_soc.py --platform cmod_a7 --build-gateware`

Same **XC7A35T** as Arty; cleaner power path than breadboard INA260 wiring.

## Procurement and wiring

### What measures what

| Signal | Path | Tool |
|--------|------|------|
| Soak control / `PASS` | Arty **USB-UART** → host `COM*` / `/dev/ttyUSB*` | [`bench_dual_fpga.py`](../../tools/bench_dual_fpga.py) + `pyserial` |
| Input power **P(t)** | **5 V rail** → INA260 → board | INA260 over **host I²C** (not FPGA PMOD) |
| Junction-adjacent temp (optional) | On-die **XADC** or heatsink thermocouple | Firmware / separate logger |

The plan mentions Arty **PMOD** as a general expansion header; this bench logs power from the **host PC** (or a Raspberry Pi) via I²C. Do not expect `bench_dual_fpga.py` to read sensors through the FPGA unless you add custom firmware.

### INA260 on the 5 V input rail

Wire each INA260 **inline on that board’s input power** so it sees total draw (FPGA + regulators + I/O). The Adafruit breakout supports high-side sensing on the **VIN+ / VIN−** screw terminals.

```
  [5 V source] -----> INA260 VIN+ -----> INA260 VIN- -----> Arty J12 (barrel) or USB VBUS
                              |                                    |
                           (I²C to host)                      (GND common)
```

**Per board:**

1. Use one **dedicated** 5 V feed per Arty (two supplies, or one 5 V / ≥ 4 A supply with separate sense branches).
2. Place INA260 **before** the Arty power input so all board current flows through the shunt.
3. Connect INA260 **VIO** to 3.3 V (from the breakout’s regulator or a Pi 3.3 V pin).
4. Connect **SDA**, **SCL**, **GND** to the host I²C bus (3.3 V logic).
5. Set **unique I²C addresses** — default `0x40`; solder **A0** on the second board for `0x41` (matches script defaults `--ina-p30 0x40 --ina-hamming 0x41`).

**Do not** share one INA260 across two boards. **Do** use the same cable length and supply type on both sides to reduce confounders.

### Host setup: Linux vs Windows

| Host | UART (Arty) | I²C (INA260) | Notes |
|------|-------------|--------------|-------|
| **Linux** (recommended) | `/dev/ttyUSB0`, `/dev/ttyUSB1` | Native `/dev/i2c-1` via `smbus2` | Enable I²C on Pi: `dtparam=i2c_arm=on` |
| **Raspberry Pi 4** | USB → two Arty cables | GPIO I²C header → both INA260 | Compact soak logger; copy CSV to PC |
| **Windows** | `COM3`, `COM4` via `pyserial` | **Not supported** by current script | Falls back to **mock** power (~1.85 W / ~2.40 W) |

**Windows options for real power data:**

1. Run the soak on **WSL2 + Linux** with a USB-I²C adapter that exposes `/dev/i2c-*` (adapter-dependent).
2. Use a **Raspberry Pi** on the bench for I²C logging and a Linux VM/SSH session for orchestration.
3. Extend `bench_dual_fpga.py` later with a USB-I²C backend (e.g. CP2112 / FT232H) — not implemented yet.

Install on the soak host:

```bash
pip install pyserial smbus2   # Linux / Pi only for smbus2
python tools/bench_dual_fpga.py --dry-run
```

### Bench checklist (before first soak)

- [ ] Two Arty boards, same revision; note serial numbers in lab notebook  
- [ ] Both bitstreams built from the same LiteX/Vivado run (matched clock constraint)  
- [ ] Corpus firmware flashed: P30 = `START LIBRARY` / `PASS`; Hamming = `START` / `PASS`  
- [ ] INA260 addresses verified (`i2cdetect -y 1` on Linux)  
- [ ] UART ports identified; `PASS` returns `OK PASS ops=…` on each board  
- [ ] Fan jig distance documented; ambient temp logged  
- [ ] Run **Mode RATE** @ 1 Hz for publication ([claim chain](thermal-claim-chain.md))

### Shopping links (quick copy)

| Part | URL |
|------|-----|
| Arty A7-35T | https://digilent.com/shop/arty-a7-35t-fpga-development-board/ |
| INA260 breakout | https://www.adafruit.com/product/4226 |
| INA260 guide (wiring) | https://learn.adafruit.com/adafruit-ina260-current-voltage-power-sensor-breakout |

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
