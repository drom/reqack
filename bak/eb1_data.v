module eb1_data #(
    parameter T_0_WIDTH = 8,
    parameter I_0_WIDTH = 8
) (
    input [T_0_WIDTH-1:0] t_0_data,
    output logic [I_0_WIDTH-1:0] i_0_data,
    input en,
    input clk, reset_n
);

always @(posedge clk) if (en) i_0_data <= t_0_data;

endmodule
