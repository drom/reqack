// node: ${id} join
assign req${id} = <%= sources.map((e, ei) => `req${id}_${e}`).join(' & ') %>;
<% sources.map((e, ei) => { %>
assign ack${id}_${e} = ack${id} & (req${id}_${e});<% }) %>
