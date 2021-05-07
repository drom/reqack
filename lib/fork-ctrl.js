'use strict';

const express = require('./express.js');

const forkCtrl = p => {

  let res = [];

  res = res.concat((p.targets.length > 1) ?
    'reg  ' + p.targets.map((e, ei) => `ack${p.id}_${ei}_r`).join(', ') :
    []
  );

  res = res.concat((p.targets.length > 1) ?
    'wire ' + p.targets.map((e, ei) => `ack${p.id}_${ei}_s`).join(', ') :
    []
  );

  res = res.concat((p.targets.length > 1) ?
    p.targets.map((e, ei) =>
      `assign req${p.id}_${ei} = req${p.id}m & ~ack${p.id}_${ei}_r`) :
    [`assign req${p.id}_0 = req${p.id}m`]
  );

  res = res.concat((p.targets.length > 1) ?
    p.targets.map((e, ei) =>
      `assign ack${p.id}_${ei}_s = ack${p.id}_${ei} | ~req${p.id}_${ei}`) :
    []
  );

  const ackm = (p.targets.length > 1) ?
    p.targets.map((e, ei) => `ack${p.id}_${ei}_s`).join(' & ') :
    `ack${p.id}_0`;

  res = res.concat(`assign ack${p.id}m = ${ackm}`);

  res = res.concat((p.targets.length > 1) ?
    p.targets.map((e, ei) =>
      `always @(posedge clk or negedge reset_n) if (~reset_n) ack${p.id}_${ei}_r <= 1'b0; else ack${p.id}_${ei}_r <= ack${p.id}_${ei}_s & ~ack${p.id}m`) :
    []
  );

  return `// edge:${p.id} fork
${express(res)}`;
};

module.exports = forkCtrl;
