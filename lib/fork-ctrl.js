'use strict';

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

module.exports = forkCtrl;
