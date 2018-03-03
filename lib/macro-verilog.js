'use strict';

const forkCtrl = p => {
    const ackm = p.targets.map((e, ei) =>
        `ack${p.id}_${ei}`
    ).join(' & ');

    const ackr = p.targets.map((e, ei) =>
        `always_ff @(posedge clk or negedge reset_n) if (~reset_n) ack${p.id}_${ei}_r <= 1'b0; else ack${p.id}_${ei}_r <= ack${p.id}_${ei} & ~ack${p.id};`
    ).join('\n');

    const reqs = p.targets.map((e, ei) =>
        `assign req${p.id}_${ei} = req${p.id}m & ~ack${p.id}_${ei}_r;`
    ).join('\n');

    return `
// edge:${p.id} fork
assign ack${p.id}m = ${ackm};

${ackr}
${reqs}
`;
};

const fork = {
    ctrl: forkCtrl,
    data: () => '',
    ctrl2data: () => ({})
};

const join = {
    ctrl: () => '',
    data: () => '',
    ctrl2data: () => ({})
};

const eb0 = {
    ctrl: p => `
// edge:${p.id} EB0
logic ${p.i.ready}, ${p.i.valid};
assign ${p.i.valid} = ${p.t.valid};
assign ${p.t.ready} = ${p.i.ready};
`,
    data: p => `
// edge:${p.id} EB0
assign ${p.i.data} = ${p.t.data};
`,
    ctrl2data: () => ({})
};

const eb1 = {
    ctrl: p => `
// edge:${p.id} EB1
logic ${p.i.ready}, ${p.i.valid};
assign en${p.id} = ${p.t.valid} & ${p.i.ready};
assign ${p.t.ready} = ~${p.t.valid} | ${p.i.ready};
always @(posedge clk or negedge reset_n) if (~reset_n) ${p.i.valid} <= 1'b0; else ${p.i.valid} <= ~${p.i.ready} | ${p.t.valid};
`,
    data: p => `
// edge:${p.id} EB1
always @(posedge clk) if (en_${p.id}) ${p.i.data} <= ${p.t.data};
`,
    ctrl2data: p => {
        let res = {};
        res[`en_${p.id}`] = 1;
        return res;
    }
};

const eb2a = {
    ctrl: p => `
// edge:${p.id} EB2a
logic ${p.i.ready}, ${p.i.valid};
eb2a_ctrl uctrl_${p.id} (
    .t_0_valid(${p.t.valid}), .t_0_ready(${p.t.ready}),
    .i_0_valid(${p.i.valid}), .i_0_ready(${p.i.ready}),
    .en0(en${p.id}_0), .en1(en${p.id}_1), .sel(sel${p.id}),
    .clk(clk), .reset_n(reset_n)
);
`,
    data: p => `
// edge:${p.id} EB2a
logic [${p.I.WIDTH - 1}:0] reg0_${p.id}, reg1_${p.id};

always @(posedge clk) begin
    if (en0_${p.id}) reg0_${p.id} <= ${p.t.data};
    if (en1_${p.id}) reg1_${p.id} <= ${p.t.data};
end

assign ${p.i.data} = sel_${p.id} ? reg1_${p.id} : reg0_${p.id};
`,
    ctrl2data: p => {
        let res = {};
        res[`en0_${p.id}`] = 1;
        res[`en0_${p.id}`] = 1;
        res[`sel_${p.id}`] = 1;
        return res;
    }
};

const eb = {
    ctrl: p =>
        (p.capacity === 1) ? eb1.ctrl(p) :
            (p.capacity === 2) ? eb2a.ctrl(p) :
                eb0.ctrl(p),
    data: p =>
        (p.capacity === 1) ? eb1.data(p) :
            (p.capacity === 2) ? eb2a.data(p) :
                eb0.data(p),
    ctrl2data: p =>
        (p.capacity === 1) ? eb1.ctrl2data(p) :
            (p.capacity === 2) ? eb2a.ctrl2data(p) :
                eb0.ctrl2data(p)
};

module.exports = {
    fork: fork,
    join: join,
    eb0: eb0,
    eb1: eb1,
    eb2: eb2a,
    eb: eb
};
