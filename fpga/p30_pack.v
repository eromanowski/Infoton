// P30 30-bit unit lane pack/unpack (P30-ISA v0.1 §1.3)
// Golden reference: emulator/p30emu/src/unit.rs

`timescale 1ns / 1ps

module p30_pack_lane (
    input  wire [29:0] unit0,
    input  wire [29:0] unit1,
    input  wire [29:0] unit2,
    input  wire [29:0] unit3,
    output wire [119:0] lane
);
    genvar i;
    generate
        for (i = 0; i < 120; i = i + 1) begin : g_pack
            wire [29:0] u =
                (i < 30)  ? unit0 :
                (i < 60)  ? unit1 :
                (i < 90)  ? unit2 : unit3;
            assign lane[i] = u[i % 30];
        end
    endgenerate
endmodule

module p30_unpack_lane (
    input  wire [119:0] lane,
    output wire [29:0] unit0,
    output wire [29:0] unit1,
    output wire [29:0] unit2,
    output wire [29:0] unit3
);
    genvar b;
    generate
        for (b = 0; b < 30; b = b + 1) begin : g_unpack
            assign unit0[b] = lane[b];
            assign unit1[b] = lane[30 + b];
            assign unit2[b] = lane[60 + b];
            assign unit3[b] = lane[90 + b];
        end
    endgenerate
endmodule

// Convenience wrapper: pack units to 15-byte lane (bytes_out[8*k +: 8] = lane[8*k +: 8])
module p30_lane_pack (
    input  wire [29:0] unit0,
    input  wire [29:0] unit1,
    input  wire [29:0] unit2,
    input  wire [29:0] unit3,
    output wire [119:0] bytes_out
);
    p30_pack_lane pack_i (
        .unit0(unit0),
        .unit1(unit1),
        .unit2(unit2),
        .unit3(unit3),
        .lane(bytes_out)
    );
endmodule

module p30_lane_unpack (
    input  wire [119:0] bytes_in,
    output wire [29:0] unit0,
    output wire [29:0] unit1,
    output wire [29:0] unit2,
    output wire [29:0] unit3
);
    p30_unpack_lane unpack_i (
        .lane(bytes_in),
        .unit0(unit0),
        .unit1(unit1),
        .unit2(unit2),
        .unit3(unit3)
    );
endmodule

// Coprimality check: gcd(unit, 30) == 1 and unit != 0 (low 30 bits)
module p30_valid_unit (
    input  wire [29:0] unit,
    output wire        valid
);
    // Static small lookup: valid iff unit mod 2 != 0, mod 3 != 0, mod 5 != 0, unit != 0
    wire zero = (unit == 30'd0);
    wire div2 = (unit[0] == 1'b0);
    wire div3 = (unit % 30'd3 == 30'd0);
    wire div5 = (unit % 30'd5 == 30'd0);
    assign valid = ~zero & ~div2 & ~div3 & ~div5;
endmodule
