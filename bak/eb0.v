module eb0 #(
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

assign i_0_data = t_0_data;
assign i_0_valid = t_0_valid;
assign t_0_ready = i_0_ready;

endmodule
