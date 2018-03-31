module eb_fifo_ctrl #(
    parameter DEPTHMO = 4'd15,
    parameter DEPTHLOG2MO = 3
) (
    input   t_0_req,
    output  t_0_ack,
    output  i_0_req,
    input   i_0_ack,
    output reg [DEPTHLOG2MO : 0] wr_ptr,
    output reg [DEPTHLOG2MO : 0] rd_ptr,
    output  wen, ren,
    input   clk, reset_n
);

reg [DEPTHLOG2MO : 0] status_cnt;

assign t_0_ack = !(status_cnt == DEPTHMO);
assign ren = i_0_req && i_0_ack;
assign wen = t_0_req && t_0_ack;

always @(posedge clk or negedge reset_n)
    if (~reset_n) i_0_req <= 1'b0;
    else if (status_cnt == DEPTHMO) i_0_req <= 0;
    else if ((i_0_req && i_0_ack) && (status_cnt == 1)) i_0_req <= 0;
    else i_0_req <= 1;

always @(posedge clk or negedge reset_n)
    if (~reset_n) wr_ptr <= 0;
    else if (t_0_req && t_0_ack) wr_ptr <= (wr_ptr == DEPTHMO) ? 0 : (wr_ptr + 1);

always @(posedge clk or negedge reset_n)
    if (~reset_n) rd_ptr <= 0;
    else if (i_0_req && i_0_ack) rd_ptr <= (((rd_ptr == DEPTHMO) && (status_cnt != 0)) ? 0 : (rd_ptr + 1));

always @(posedge clk or negedge reset_n)
    if (~reset_n) status_cnt <= 0;
    else if ((i_0_req && i_0_ack) && (t_0_req && t_0_ack)) status_cnt <= status_cnt;
    else if (i_0_req && i_0_ack && (status_cnt != 0)) status_cnt <= status_cnt - 1;
    else if (t_0_req && t_0_ack) status_cnt <= status_cnt + 1;

endmodule
