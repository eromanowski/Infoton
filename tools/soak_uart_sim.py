#!/usr/bin/env python3
"""PTY-backed UART emulation for bench_dual_fpga (optional advanced test)."""

from __future__ import annotations

import os
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from soak_core import load_corpus, run_hamming_pass, run_p30_pass  # noqa: E402


class SoakUartBackend:
    """Minimal UART backend: responds to START like firmware."""

    def __init__(self, mode: str) -> None:
        self.mode = mode
        self.corpus, self.positions = load_corpus()
        self.passes = 0
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self.rx_buf = bytearray()
        self.tx_buf = bytearray()

    def start_loop(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._hot_loop, daemon=True)
        self._thread.start()

    def _hot_loop(self) -> None:
        while not self._stop.is_set():
            if self.mode == "hamming":
                run_hamming_pass(self.corpus)
            else:
                run_p30_pass(self.mode == "library", self.corpus, self.positions)
            self.passes += 1
            if (self.passes & 0x3F) == 0:
                msg = f"TICK passes={self.passes:x}\r\n"
                self.tx_buf.extend(msg.encode("ascii"))

    def feed(self, data: bytes) -> None:
        self.rx_buf.extend(data)
        while b"\n" in self.rx_buf or b"\r" in self.rx_buf:
            for sep in (b"\r\n", b"\n", b"\r"):
                if sep in self.rx_buf:
                    line, _, rest = self.rx_buf.partition(sep)
                    self.rx_buf = bytearray(rest)
                    break
            else:
                break
            cmd = line.decode("ascii", errors="ignore").strip().upper()
            if cmd.startswith("START"):
                self.tx_buf.extend(b"OK START\r\n")
                self.start_loop()
            elif cmd == "STATUS":
                self.tx_buf.extend(f"STATUS passes={self.passes:x}\r\n".encode())

    def read(self, n: int = 4096) -> bytes:
        out = bytes(self.tx_buf[:n])
        del self.tx_buf[: len(out)]
        return out


def try_pty_bench() -> bool:
    """Run bench_dual_fpga against PTY pair if Unix pty available."""
    if sys.platform == "win32":
        return False
    try:
        import pty
    except ImportError:
        return False

    import subprocess

    p30_m, p30_s = pty.openpty()
    ham_m, ham_s = pty.openpty()
    p30 = SoakUartBackend("library")
    ham = SoakUartBackend("hamming")

    def pump(master: int, backend: SoakUartBackend) -> None:
        while True:
            try:
                chunk = os.read(master, 1024)
            except OSError:
                break
            if not chunk:
                break
            backend.feed(chunk)
            out = backend.read()
            if out:
                os.write(master, out)

    t1 = threading.Thread(target=pump, args=(p30_s, p30), daemon=True)
    t2 = threading.Thread(target=pump, args=(ham_s, ham), daemon=True)
    t1.start()
    t2.start()

    p30_name = os.ttyname(p30_m)
    ham_name = os.ttyname(ham_m)
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "tools" / "bench_dual_fpga.py"),
            "--p30-port",
            p30_name,
            "--hamming-port",
            ham_name,
            "--burn-in",
            "1",
            "--duration",
            "2",
            "--interval",
            "0.5",
        ],
        check=True,
        timeout=30,
    )
    return True


if __name__ == "__main__":
    if try_pty_bench():
        print("uart_pty_bench: PASS")
    else:
        print("uart_pty_bench: skipped (Windows or no pty)")
