module radix2 (
    // per node (target / initiator)
    input              clk,
    input              reset_n,
    input       [31:0] t_a_dat,
    input              t_a_req,
    output             t_a_ack,
    input       [31:0] t_b_dat,
    input              t_b_req,
    output             t_b_ack,
    output      [31:0] i_x_dat,
    output             i_x_req,
    input              i_x_ack,
    output      [31:0] i_y_dat,
    output             i_y_req,
    input              i_y_ack
);
wire      [31:0] dat0, dat1, dat2, dat2_nxt, dat3, dat3_nxt;
// per node
assign dat0 = t_a_dat; // node:0 is target port
assign dat1 = t_b_dat; // node:1 is target port
assign dat2_nxt = (dat0 + dat1); // node:2 operator +
assign dat3_nxt = (dat0 - dat1); // node:3 operator -
assign i_x_dat = dat2; // node:4 is initiator port
assign i_y_dat = dat3; // node:5 is initiator port
// per edge



// edge:2 EB1.5
wire en2_0, en2_1, sel2;
reg [31:0] dat2_r0, dat2_r1;
always @(posedge clk) if (en2_0) dat2_r0 <= dat2_nxt;
always @(posedge clk) if (en2_1) dat2_r1 <= dat2_nxt;

assign dat2 = sel2 ? dat2_r1 : dat2_r0;


// edge:3 EB1.5
wire en3_0, en3_1, sel3;
reg [31:0] dat3_r0, dat3_r1;
always @(posedge clk) if (en3_0) dat3_r0 <= dat3_nxt;
always @(posedge clk) if (en3_1) dat3_r1 <= dat3_nxt;

assign dat3 = sel3 ? dat3_r1 : dat3_r0;

radix2_ctrl uctrl (
    .clk(clk),
    .reset_n(reset_n),
    .t_a_req(t_a_req),
    .t_a_ack(t_a_ack),
    .t_b_req(t_b_req),
    .t_b_ack(t_b_ack),
    .i_x_req(i_x_req),
    .i_x_ack(i_x_ack),
    .i_y_req(i_y_req),
    .i_y_ack(i_y_ack),
    .en2_0(en2_0),
    .en2_1(en2_1),
    .sel2(sel2),
    .en3_0(en3_0),
    .en3_1(en3_1),
    .sel3(sel3)
);
endmodule // radix2

module radix2_ctrl (
    // per node (target / initiator)
    input              clk,
    input              reset_n,
    input              t_a_req,
    output             t_a_ack,
    input              t_b_req,
    output             t_b_ack,
    output             i_x_req,
    input              i_x_ack,
    output             i_y_req,
    input              i_y_ack,
    output             en2_0,
    output             en2_1,
    output             sel2,
    output             en3_0,
    output             en3_1,
    output             sel3
);
wire             req0, ack0, ack0_0, req0_0, ack0_1, req0_1, req1, ack1, ack1_0, req1_0, ack1_1, req1_1, req2, ack2, ack2_0, req2_0, req3, ack3, ack3_0, req3_0;
// node:t_a target
assign req0 = t_a_req;
assign t_a_ack = ack0;
// node:t_b target
assign req1 = t_b_req;
assign t_b_ack = ack1;
// edge:0 EB0
wire ack0m, req0m;
assign req0m = req0;
assign ack0 = ack0m;

// edge:0 fork
reg  ack0_0_r, ack0_1_r;
wire ack0_0_s, ack0_1_s;
assign req0_0 = req0m & ~ack0_0_r;
assign req0_1 = req0m & ~ack0_1_r;
assign ack0_0_s = ack0_0 | ~req0_0;
assign ack0_1_s = ack0_1 | ~req0_1;
assign ack0m = ack0_0_s & ack0_1_s;
always @(posedge clk or negedge reset_n) if (~reset_n) ack0_0_r <= 1'b0; else ack0_0_r <= ack0_0_s & ~ack0m;
always @(posedge clk or negedge reset_n) if (~reset_n) ack0_1_r <= 1'b0; else ack0_1_r <= ack0_1_s & ~ack0m;
// edge:1 EB0
wire ack1m, req1m;
assign req1m = req1;
assign ack1 = ack1m;

// edge:1 fork
reg  ack1_0_r, ack1_1_r;
wire ack1_0_s, ack1_1_s;
assign req1_0 = req1m & ~ack1_0_r;
assign req1_1 = req1m & ~ack1_1_r;
assign ack1_0_s = ack1_0 | ~req1_0;
assign ack1_1_s = ack1_1 | ~req1_1;
assign ack1m = ack1_0_s & ack1_1_s;
always @(posedge clk or negedge reset_n) if (~reset_n) ack1_0_r <= 1'b0; else ack1_0_r <= ack1_0_s & ~ack1m;
always @(posedge clk or negedge reset_n) if (~reset_n) ack1_1_r <= 1'b0; else ack1_1_r <= ack1_1_s & ~ack1m;

// edge:2 EB1.5
wire ack2m, req2m;
eb15_ctrl uctrl_2 (
    .t_0_req(req2), .t_0_ack(ack2),
    .i_0_req(req2m), .i_0_ack(ack2m),
    .en0(en2_0), .en1(en2_1), .sel(sel2),
    .clk(clk), .reset_n(reset_n)
);

// edge:2 fork
assign req2_0 = req2m;
assign ack2m = ack2_0;

// edge:3 EB1.5
wire ack3m, req3m;
eb15_ctrl uctrl_3 (
    .t_0_req(req3), .t_0_ack(ack3),
    .i_0_req(req3m), .i_0_ack(ack3m),
    .en0(en3_0), .en1(en3_1), .sel(sel3),
    .clk(clk), .reset_n(reset_n)
);

// edge:3 fork
assign req3_0 = req3m;
assign ack3m = ack3_0;
// node:2 join +
// join:2, fork:1
assign req2 = req0_0 & req1_0;
assign ack0_0 = ack2 & req1_0;
assign ack1_0 = ack2 & req0_0;
// node:3 join -
// join:2, fork:1
assign req3 = req0_1 & req1_1;
assign ack0_1 = ack3 & req1_1;
assign ack1_1 = ack3 & req0_1;
// node:4 initiator
assign i_x_req = req2_0;
assign ack2_0 = i_x_ack;
// node:5 initiator
assign i_y_req = req3_0;
assign ack3_0 = i_y_ack;
endmodule // radix2_ctrl
