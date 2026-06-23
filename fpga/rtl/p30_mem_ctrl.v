// Wishbone P30 byte memory + lane pack/unpack CSRs (P30-ISA v0.1)
// Golden pack/unpack: p30_pack.v

`timescale 1ns / 1ps

module p30_mem_ctrl #(
    parameter DEPTH_BYTES = 4096
) (
    input  wire         clk,
    input  wire         rst,

    // Wishbone slave — byte-wide P30 memory at 0x1001_0000
    input  wire         wb_cyc,
    input  wire         wb_stb,
    input  wire         wb_we,
    input  wire [31:0]  wb_adr,
    output reg          wb_ack,
    input  wire [7:0]   wb_dat_w,
    output reg  [7:0]   wb_dat_r,

    // Pack CSRs (simple parallel interface; LiteX maps to CSR bank)
    input  wire         pack_strobe,
    input  wire [29:0]  pack_unit0,
    input  wire [29:0]  pack_unit1,
    input  wire [29:0]  pack_unit2,
    input  wire [29:0]  pack_unit3,
    output wire [119:0] pack_lane,

    input  wire         unpack_strobe,
    input  wire [119:0] unpack_lane,
    output wire [29:0]  unpack_unit0,
    output wire [29:0]  unpack_unit1,
    output wire [29:0]  unpack_unit2,
    output wire [29:0]  unpack_unit3,

    output wire         pack_lane_valid
);
    localparam AW = $clog2(DEPTH_BYTES);

    reg [7:0] mem [0:DEPTH_BYTES-1];

    p30_lane_pack pack_i (
        .unit0(pack_unit0),
        .unit1(pack_unit1),
        .unit2(pack_unit2),
        .unit3(pack_unit3),
        .bytes_out(pack_lane)
    );

    p30_lane_unpack unpack_i (
        .bytes_in(unpack_lane),
        .unit0(unpack_unit0),
        .unit1(unpack_unit1),
        .unit2(unpack_unit2),
        .unit3(unpack_unit3)
    );

    wire [29:0] lane_unit0 = unpack_unit0;
    wire        u0_valid;
    p30_valid_unit valid0 (.unit(lane_unit0), .valid(u0_valid));
    assign pack_lane_valid = u0_valid;

    wire [AW-1:0] adr = wb_adr[AW-1:0];

    always @(posedge clk) begin
        wb_ack <= 1'b0;
        if (rst) begin
            wb_dat_r <= 8'h00;
        end else if (wb_cyc && wb_stb) begin
            wb_ack <= 1'b1;
            if (wb_we)
                mem[adr] <= wb_dat_w;
            else
                wb_dat_r <= mem[adr];
        end
    end

    // On pack_strobe, write 15-byte lane to mem at wb_adr[AW-1:0] (caller sets base)
    integer k;
    always @(posedge clk) begin
        if (pack_strobe) begin
            for (k = 0; k < 15; k = k + 1)
                mem[wb_adr[AW-1:0] + k] <= pack_lane[k*8 +: 8];
        end
    end

    always @(posedge clk) begin
        if (unpack_strobe) begin
            for (k = 0; k < 15; k = k + 1)
                ; // lane assembled externally from mem reads on CPU side in v0.1
        end
    end
endmodule
