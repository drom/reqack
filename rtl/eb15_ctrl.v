module eb15_ctrl #(
    parameter S0 = 5'b1_0_10_0,
    parameter S1 = 5'b1_1_01_0,
    parameter S2 = 5'b0_1_00_0,
    parameter S3 = 5'b1_1_10_1,
    parameter S4 = 5'b0_1_00_1
) (
    input  t_0_req,
    output t_0_ack,
    output i_0_req,
    input  i_0_ack,
    output en0, en1, sel,
    input  clk, reset_n
);

// State machine
reg [4:0] state, state_nxt;

always @(posedge clk or negedge reset_n)
    if (~reset_n) state <= S0;
    else          state <= state_nxt;

//  state   d0  d1  t.ack   i.req   en0     en1     sel
//  0       x   x   1       0       t.req   0       0       1_0_10_0
//  1       0   x   1       1       0       t.req   0       1_1_01_0
//  2       0   1   0       1       0       0       0       0_1_00_0
//  3       x   0   1       1       t.req   0       1       1_1_10_1
//  4       1   0   0       1       0       0       1       0_1_00_1

always @*
    casez({state, t_0_req, i_0_ack})
        {S0, 2'b1?} : state_nxt = S1;

        {S1, 2'b01} : state_nxt = S0;
        {S1, 2'b10} : state_nxt = S2;
        {S1, 2'b11} : state_nxt = S3;

        {S2, 2'b?1} : state_nxt = S3;

        {S3, 2'b01} : state_nxt = S0;
        {S3, 2'b10} : state_nxt = S4;
        {S3, 2'b11} : state_nxt = S1;

        {S4, 2'b?1} : state_nxt = S1;
        default       state_nxt = state;
    endcase

assign t_0_ack = state[4];
assign i_0_req = state[3];
assign en0     = state[2] & t_0_req;
assign en1     = state[1] & t_0_req;
assign sel     = state[0];

endmodule
