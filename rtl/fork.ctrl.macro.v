// edge: ${id} fork
assign ack${id}m = <%= targets.map((e, ei) => `ack${id}_${ei}`).join(' & ') %>;
<% targets.map((e, ei) => { %>
always_ff @(posedge clk or negedge reset_n) if (~reset_n) ack${id}_${ei}_r <= 1'b0; else ack${id}_${ei}_r <= ack${id}_${ei} & ~ack${id};<% }) %>
<% targets.map((e, ei) => { %>
assign req${id}_${ei} = req${id}m & ~ack${id}_${ei}_r;<% }) %>
