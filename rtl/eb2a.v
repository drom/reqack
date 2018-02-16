module eb2a #(
    parameter T_0_WIDTH = 8,
    parameter I_0_WIDTH = 8
) (
    input [T_0_WIDTH-1:0] t_0_data,
    output logic [I_0_WIDTH-1:0] i_0_data,
    input en0, en1, sel,
    input clk, reset_n
);

logic [I_0_WIDTH-1:0] reg0, reg1;

always @(posedge clk) begin
    if (en0) reg0 <= t_0_data;
    if (en1) reg1 <= t_0_data;
end

assign i_0_data = sel ? reg1 : reg0;

endmodule
