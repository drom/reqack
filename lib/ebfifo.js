'use strict';

const data = p => {
  const depthlog2 = Math.ceil(Math.log2(p.capacity));
  return `
// edge:${p.id} EB_FIFO Depth=${p.capacity}
reg [${p.width - 1}:0] mem${p.id} [${p.capacity - 1}:0];
reg [${p.width - 1}:0] dat${p.id}_r0;
wire ren${p.id}, wen${p.id};
wire [${depthlog2 - 1}:0] wr_ptr${p.id}, rd_ptr${p.id};

always @(posedge clk) if (ren${p.id} && wen${p.id} && (wr_ptr${p.id} == rd_ptr${p.id})) dat${p.id}_r0 <= ${p.t.data}; else if(ren${p.id}) dat${p.id}_r0 <= mem${p.id}[rd_ptr${p.id}];
always @(posedge clk) if (wen${p.id}) mem${p.id}[wr_ptr${p.id}] <= ${p.t.data};

assign ${p.i.data} = dat${p.id}_r0;
`;
};

const ctrl = p => {
  const depthlog2 = Math.ceil(Math.log2(p.capacity));
  return `
// edge:${p.id} EB_FIFO
wire ${p.i.ready}, ${p.i.valid};
eb_fifo_ctrl #(
    .DEPTHMO(${depthlog2}'d${p.capacity - 1}),
    .DEPTHLOG2MO(${depthlog2 - 1})
) uctrl_${p.id} (
    .t_0_req(${p.t.valid}), .t_0_ack(${p.t.ready}),
    .i_0_req(${p.i.valid}), .i_0_ack(${p.i.ready}),
    .wr_ptr(wr_ptr${p.id}),
    .rd_ptr(rd_ptr${p.id}),
    .wen(wen${p.id}),
    .ren(ren${p.id}),
    .clk(clk), .reset_n(reset_n)
);
`;
};

module.exports = {
  ctrl: ctrl,
  data: data,
  ctrl2data: p => {
    const ptrWidth = Math.ceil(Math.log2(p.capacity));
    let res = {};
    res[`wr_ptr${p.id}`] = ptrWidth;
    res[`rd_ptr${p.id}`] = ptrWidth;
    res[`wen${p.id}`] = 1;
    res[`ren${p.id}`] = 1;
    return res;
  }
};
