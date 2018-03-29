<%
    if (capacity === 1) {
%>
// edge ${id} EB1
logic ${i.ready}, ${i.valid};
assign en${id} = ${t.valid} & ${i.ready};
assign ${t.ready} = ~${t.valid} | ${i.ready};
always @(posedge clk or negedge reset_n) if (~reset_n) ${i.valid} <= 1'b0; else ${i.valid} <= ~${i.ready} | ${t.valid};
<%
    } else if (capacity === 2) {
%>
// edge ${id} EB2a
eb2a_ctrl uctrl_${id} (
    .t_0_valid(${t.valid}), .t_0_ready(${t.ready}),
    .i_0_valid(${i.valid}), .i_0_ready(${i.ready}),
    .en0(en${id}_0), .en1(en${id}_1), .sel(sel${id}),
    .clk(clk), .reset_n(reset_n)
);
<%
    } else {
%>
// edge ${id} EB0
logic ${i.ready}, ${i.valid};
assign ${i.valid} = ${t.valid};
assign ${t.ready} = ${i.ready};
<%
    }
%>
