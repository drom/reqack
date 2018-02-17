<% if (capacity === 1) { %>
// edge ${id} EB1
logic en${id}, ${i_0_ready}, ${i_0_valid};
assign en${id} = ${t_0_valid} & ${i_0_ready};
assign ${t_0_ready} = ~${t_0_valid} | ${i_0_ready};
always @(posedge clk or negedge reset_n) if (~reset_n) ${i_0_valid} <= 1'b0; else ${i_0_valid} <= ~${i_0_ready} | ${t_0_valid};
<% } else if (capacity === 2) { %>
// edge ${id} EB2a
logic en0_${id}, en1_${id}, sel_${id};
eb2a_ctrl uctrl_${id} (
    .t_0_valid(${t_0_valid}), .t_0_ready(${t_0_ready}),
    .i_0_valid(${i_0_valid}), .i_0_ready(${i_0_ready}),
    .en0(en0_${id}), .en1(en1_${id}), .sel(sel_${id}),
    .clk(clk), .reset_n(reset_n)
);
<% } else { %>
// edge ${id} EB0
assign ${i_0_valid} = ${t_0_valid};
assign ${t_0_ready} = ${i_0_ready};
<% } %>
