module eb15_ctrl #(
    parameter S0 = 5'b00001,
    parameter S1 = 5'b00010,
    parameter S2 = 5'b00100,
    parameter S3 = 5'b01000,
    parameter S4 = 5'b10000
) (
    input  clk, reset_n,
    input        t_0_valid,
    output logic t_0_ready,
    output logic i_0_valid,
    output logic en0, en1, sel,
    input        i_0_ready
);

// State machine
logic [4:0] state, nxt_state;

always_ff @(posedge clk or negedge reset_n)
    if (~reset_n) state <= 5'b00001;
    else          state <= nxt_state;

// state d0 d1 tready ivalid  en0   en1   sel
// 0     x  x   1       0     valid 0     ?
// 1     0  x   1       1     0     valid 0
// 2     0  1   0       1     0     0     0
// 3     x  0   1       1     valid 0     1
// 4     1  0   0       1     0     0     1

always_comb
    casez({state, t_0_valid, i_0_ready})
        {S0, 2'b1?} : nxt_state = S1;
        {S1, 2'b01} : nxt_state = S0;
        {S1, 2'b10} : nxt_state = S2;
        {S1, 2'b11} : nxt_state = S3;
        {S2, 2'b?1} : nxt_state = S3;
        {S3, 2'b01} : nxt_state = S0;
        {S3, 2'b10} : nxt_state = S4;
        {S3, 2'b11} : nxt_state = S1;
        {S4, 2'b?1} : nxt_state = S1;
        default       nxt_state = state;
    endcase

assign sel =  state[3] | state[4];
assign en0 = (state[0] | state[3]) & t_0_valid;
assign en1 =  state[1]             & t_0_valid;

assign t_0_ready = ~(state[2] | state[4]);
assign i_0_valid = ~state[0];

endmodule
