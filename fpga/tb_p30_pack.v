// Golden testbench for p30_pack.v — run: python tools/verify_p30_pack.py

`timescale 1ns / 1ps

module tb_p30_pack;
    reg  [29:0] unit0, unit1, unit2, unit3;
    wire [119:0] bytes_out;
    wire [29:0] unit0_r, unit1_r, unit2_r, unit3_r;

    p30_lane_pack pack_i (
        .unit0(unit0),
        .unit1(unit1),
        .unit2(unit2),
        .unit3(unit3),
        .bytes_out(bytes_out)
    );

    p30_lane_unpack unpack_i (
        .bytes_in(bytes_out),
        .unit0(unit0_r),
        .unit1(unit1_r),
        .unit2(unit2_r),
        .unit3(unit3_r)
    );

    initial begin
        $display("tb_p30_pack: running golden vectors...");
        `include "golden_pack.inc"
        $display("tb_p30_pack: PASS");
        $finish;
    end
endmodule
