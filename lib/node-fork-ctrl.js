'use strict';

// fork controller generator for nodes

const nodeForkCtrl = p => [`// node:${p.id} fork`]
    .concat(
        'reg    ' + p.i.map(e => `req${e}_reg`).join(', ')
    )
    .concat(p.i.map(e =>
        `assign req${e} = req${p.t[0]} & ~req${e}_reg`
    ))
    .concat(
        'wire   ' + p.i.map(e => `ack${e}_g`).join(', ')
    )
    .concat(p.i.map(e =>
        `assign ack${e}_g = ack${e} | ~req${e}`
    ))
    .concat(`assign ack${p.t[0]} = ` + p.i.map(e =>
        `ack${e}_g`
    ).join(' & '))
    .concat(p.i.map(e =>
        `always @(posedge clk or negedge reset_n) if (~reset_n) req${e}_reg <= 1'b0; else req${e}_reg <= ack${e}_g & ~ack${p.t[0]}`
    ))
    .concat('')
    .join(';\n');

module.exports = nodeForkCtrl;
