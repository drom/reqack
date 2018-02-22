// node: ${id} join
<%
    to.forEach(eto => {
%>
assign req${destination} = <%= sources.map((e, ei) => `req${id}_${e}`).join(' & ') %>;
<%
    });
%>
<%
    sources.map((e, ei) => {
%>
assign ack${id}_${e} = ack${id} & (req${id}_${e});
<%
    })
%>
