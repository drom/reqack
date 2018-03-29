module ebn #(
    parameter T_0_WIDTH = 8,
    parameter I_0_WIDTH = 8,
    parameter DEPTH = 4
) (
    input        [T_0_WIDTH-1:0] t_0_data,
    input                        t_0_valid,
    output logic                 t_0_ready,

    output logic [I_0_WIDTH-1:0] i_0_data,
    output logic                 i_0_valid,
    input                        i_0_ready,

    input clk, reset_n
);

// TODO design / validate FIFO based elastic controller

endmodule
