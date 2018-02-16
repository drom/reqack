module eb2a #(
    parameter T_0_WIDTH = 8,
    parameter I_0_WIDTH = 8
) (
    input        [T_0_WIDTH-1:0] t_0_data,
    input                        t_0_valid,
    output logic                 t_0_ready,

    output logic [I_0_WIDTH-1:0] i_0_data,
    output logic                 i_0_valid,
    input                        i_0_ready,

    input clk, reset_n
);

logic en0, en1, sel;

eb2a_data #(
    .T_0_WIDTH(T_0_WIDTH),
    .I_0_WIDTH(I_0_WIDTH)
) udata (
    .t_0_data(t_0_data),
    .i_0_data(i_0_data),
    .en0(en0),
    .en1(en1),
    .sel(sel),
    .clk(clk),
    .reset_n(reset_n)
);

eb2a_ctrl uctrl (
    .t_0_valid(t_0_valid),
    .t_0_ready(t_0_ready),
    .i_0_valid(i_0_valid),
    .i_0_ready(i_0_ready),
    .en0(en0),
    .en1(en1),
    .sel(sel),
    .clk(clk),
    .reset_n(reset_n)
);

endmodule
