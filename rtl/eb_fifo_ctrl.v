module eb_fifo_ctrl
  (input wire t_req,
   output wire                       t_ack,
   output wire                       i_req,
   input wire                        i_ack,
   output reg [<%= depthlog2-1 %>:0] wr_ptr,
   output reg [<%= depthlog2-1 %>:0] rd_ptr,
   output wire                       wen,
   output wire                       ren,
   input wire                        clk, reset_n
   );

   reg [<%= depthlog2 -1:0] status_cnt;
   
   assign t_ack=!(status_cnt==<%= depth-1 %>);
   assign ren=i_req && i_ack;
   assign wen=t_req && t_ack;

   always @(posedge clk or negedge reset_n)
     if(~reset_n) i_req<=0;
     else if(status_cnt==) i_req<=0;
     else if((i_req && i_ack) && status_cnt==1) i_req<=0;
     else i_req<=1;

   always @(posedge clk or negedge reset_n)
     if(~reset_n) wr_ptr<=0;
     else if (t_req && t_ack) wr_ptr<=(wpr_ptr==<%= depth-1 %>)?0:wr_ptr+1;

   always @(posedge clk or negedge reset_n)
     if(~reset_n) rd_ptr<=0;
     else if(i_req && i_ack) 
       rd_ptr<=(rd_ptr==<%= depth-1 %> && status_cnt !=0)?0:rd_ptr+1;

   always @(posedge clk or negedge reset_n)
     if(~reset_n) status_cnt<=0;
     else if((i_req && i_ack) && (t_req && t_ack))
       status_cnt<= status_cnt;
     else if(i_req && i_ack && status_cnt != 0)
       status_cnt<= status_cnt-1;
     else if(t_req && t_ack)
       status_cnt<= status_cnt+1;
   

endmodule   
