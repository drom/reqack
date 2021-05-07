'use strict';

const data = p => `
// edge:${p.id} EB1.5
wire en${p.id}_0, en${p.id}_1, sel${p.id};
reg [${p.width - 1}:0] dat${p.id}_r0, dat${p.id}_r1;
always @(posedge clk) if (en${p.id}_0) dat${p.id}_r0 <= ${p.t.data};
always @(posedge clk) if (en${p.id}_1) dat${p.id}_r1 <= ${p.t.data};

assign ${p.i.data} = sel${p.id} ? dat${p.id}_r1 : dat${p.id}_r0;
`;

const ctrl = p => `
// edge:${p.id} EB1.5
wire ${p.i.ready}, ${p.i.valid};
eb15_ctrl uctrl_${p.id} (
    .t_0_req(${p.t.valid}), .t_0_ack(${p.t.ready}),
    .i_0_req(${p.i.valid}), .i_0_ack(${p.i.ready}),
    .en0(en${p.id}_0), .en1(en${p.id}_1), .sel(sel${p.id}),
    .clk(clk), .reset_n(reset_n)
);
`;

module.exports = {
  ctrl: ctrl,
  data: data,
  ctrl2data: p => {
    let res = {};
    res[`en${p.id}_0`] = 1;
    res[`en${p.id}_1`] = 1;
    res[`sel${p.id}`]  = 1;
    return res;
  }
};
