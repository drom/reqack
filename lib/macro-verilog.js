'use strict';

const eb15 = require('./eb15');
const eb17 = require('./eb17');
const ebfifo = require('./ebfifo');

const forkCtrl = p => {

    const wires = (p.targets.length > 1) ? 'reg  ' + p.targets.map((e, ei) =>
        `ack${p.id}_${ei}_r`
    ).join(', ') + ';' : '';

    const regs = (p.targets.length > 1) ? 'wire ' + p.targets.map((e, ei) =>
        `ack${p.id}_${ei}_s`
    ).join(', ') + ';' : '';

    const reqs = (p.targets.length > 1) ? p.targets.map((e, ei) =>
        `assign req${p.id}_${ei} = req${p.id}m & ~ack${p.id}_${ei}_r;`
    ).join('\n') : `assign req${p.id}_0 = req${p.id}m;`;

    const acks = (p.targets.length > 1) ? p.targets.map((e, ei) =>
        `assign ack${p.id}_${ei}_s = ack${p.id}_${ei} | ~req${p.id}_${ei};`
    ).join('\n') : '';

    const ackm = (p.targets.length > 1) ? p.targets.map((e, ei) =>
        `ack${p.id}_${ei}_s`
    ).join(' & ') : `ack${p.id}_0`;

    const ackr = (p.targets.length > 1) ? p.targets.map((e, ei) =>
        `always @(posedge clk or negedge reset_n) if (~reset_n) ack${p.id}_${ei}_r <= 1'b0; else ack${p.id}_${ei}_r <= ack${p.id}_${ei}_s & ~ack${p.id}m;`
    ).join('\n') : '';


    return `
// edge:${p.id} fork
${wires}
${regs}
${reqs}
${acks}
assign ack${p.id}m = ${ackm};
${ackr}
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
wire ${p.i.ready}, ${p.i.valid};
assign ${p.i.valid} = ${p.t.valid};
assign ${p.t.ready} = ${p.i.ready};
`,
    data: p => `
// edge:${p.id} EB0
`,
    ctrl2data: () => ({})
};

const eb1 = {
    ctrl: p => `
// edge:${p.id} EB1
wire ${p.i.ready};
reg ${p.i.valid};
assign en${p.id} = ${p.t.valid} & ${p.t.ready};
assign ${p.t.ready} = ~${p.i.valid} | ${p.i.ready};
always @(posedge clk or negedge reset_n) if (~reset_n) ${p.i.valid} <= 1'b0; else ${p.i.valid} <= ~${p.t.ready} | ${p.t.valid};
`,
    data: p => `
// edge:${p.id} EB1
reg [${p.width - 1}:0] ${p.i.data}_r;
always @(posedge clk) if (en${p.id}) ${p.i.data}_r <= ${p.t.data};
assign ${p.i.data} = ${p.i.data}_r;
`,
    ctrl2data: p => {
        let res = {};
        res[`en${p.id}`] = 1;
        return res;
    }
};

const eb = {
    ctrl: p =>
        (p.capacity === 1) ? eb1.ctrl(p) :
            (p.capacity === 1.5) ? eb15.ctrl(p) :
                (p.capacity === 1.7) ? eb17.ctrl(p) :
                    (p.capacity >= 2) ? ebfifo.ctrl(p) :
                        eb0.ctrl(p),
    data: p =>
        (p.capacity === 1) ? eb1.data(p) :
            (p.capacity === 1.5) ? eb15.data(p) :
                (p.capacity === 1.7) ? eb17.data(p) :
                    (p.capacity >= 2) ? ebfifo.data(p) :
                        eb0.data(p),
    ctrl2data: p =>
        (p.capacity === 1) ? eb1.ctrl2data(p) :
            (p.capacity === 1.5) ? eb15.ctrl2data(p) :
                (p.capacity === 1.7) ? eb17.ctrl2data(p) :
                    (p.capacity >= 2) ? ebfifo.ctrl2data(p) :
                        eb0.ctrl2data(p)
};

module.exports = {
    fork: fork,
    join: join,
    eb0: eb0,
    eb1: eb1,
    eb15: eb15,
    ebfifo: ebfifo,
    eb: eb
};
