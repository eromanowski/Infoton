"""P30 LiteX peripherals — byte memory + pack/unpack CSR bank."""

from migen import *

from litex.soc.interconnect import wishbone
from litex.soc.interconnect.csr import *


class P30PackCSRs(LiteXModule):
    """CSR pack/unpack register file (CPU fills units; reads lane words).

    Software or future Verilog `p30_lane_pack` Instance completes pack.
    See fpga/p30_pack.v and tools/verify_p30_pack.py for golden behaviour.
    """

    def __init__(self):
        self.unit0 = CSRStorage(32, description="Unit0 [29:0]")
        self.unit1 = CSRStorage(32, description="Unit1 [29:0]")
        self.unit2 = CSRStorage(32, description="Unit2 [29:0]")
        self.unit3 = CSRStorage(32, description="Unit3 [29:0]")
        self.lane0 = CSRStorage(32, description="Lane [31:0] (software or HW pack)")
        self.lane1 = CSRStorage(32, description="Lane [63:32]")
        self.lane2 = CSRStorage(32, description="Lane [95:64]")
        self.lane3 = CSRStorage(32, description="Lane [119:96]")
        self.control = CSRStorage(
            2,
            description="bit0=pack_req bit1=unpack_req (stub)",
        )
        self.status = CSRStatus(1, description="bit0=ready")


class P30ByteMemory(LiteXModule):
    """Wishbone byte RAM — P30 monitor LOAD/SAVE backing store."""

    def __init__(self, size=4096):
        self.bus = wishbone.Interface(data_width=8, addressing="word", address_width=32)
        mem = Memory(8, size)
        self.specials += mem
        adr = self.bus.adr[: (size - 1).bit_length()]
        self.sync += If(
            self.bus.cyc & self.bus.stb,
            If(
                self.bus.we,
                mem[adr].eq(self.bus.dat_w),
            ).Else(
                self.bus.dat_r.eq(mem[adr]),
            ),
            self.bus.ack.eq(1),
        ).Else(
            self.bus.ack.eq(0),
        )
