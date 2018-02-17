module eb1_ctrl (
    input  clk, reset_n,
    input        t_0_valid,
    output logic t_0_ready,
    output logic i_0_valid,
    output logic en,
    input        i_0_ready
);

assign en = t_0_valid & i_0_ready;

assign t_0_ready = ~t_0_valid | i_0_ready;

always @(posedge clk or negedge reset_n)
    if (~reset_n) i_0_valid <= 1'b0;
    else          i_0_valid <= (~i_0_ready | t_0_valid);

endmodule
