module eb1_ctrl (
    input  clk, reset_n,
    input        t_0_valid,
    output logic t_0_ready,
    output logic i_0_valid,
    output logic en,
    input        i_0_ready
);

assign en = t_0_valid & i_0_ready;

// acknowladge path
assign t_0_ready = ~t_0_valid | i_0_ready;

// request path
always @(posedge clk or negedge reset_n)
    if (~reset_n) i_0_valid <= 0;
    else          i_0_valid <= (~i_0_ready | t_0_valid);

endmodule
