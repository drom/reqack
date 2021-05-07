'use strict';

// Multiple Inputs Multiple Outputs (MIMO) controller

const vectorDim = require('./vector-dim');

const concat = list => '{' + list.reverse().join(', ') + '}';

const op = o => nodes => nodes.join(o);

const and = op(' & ');
const or = op(' | ');

const repeat = (val, count) => '{' + count + '{' + val + '}}';

const genDeclaration = (res, type) =>
  list =>
    res.push(Object.keys(list).map(dim =>
      type + vectorDim(dim) + list[dim].join(', ') + ';'));

const genBody = () => {
  let state = [];
  return {
    comment: function() {
      let res = '// ';
      for (let i = 0; i < arguments.length; i++) {
        res += arguments[i].toString();
      }
      state.push(res);
    },
    wire: genDeclaration(state, 'wire '),
    reg: genDeclaration(state, 'reg  '),
    assign: (lhs, rhs) => state.push('assign ' + lhs + ' = ' + rhs + ';'),
    ff: (lhs, rhs, len) => state.push(
      'always @(posedge clk or negedge reset_n) if (~reset_n) ' +
      lhs + ' <= ' + len + '\'b0; else ' +
      lhs + ' <= ' + rhs + ';'
    ),
    toString: () => state.join('\n')
  };
};

const mimo = u => {
  const tLen = u.t.length;
  const iLen = u.i.length;

  if (tLen < 1) {
    throw new Error('no targets sockets');
  }
  if (iLen < 1) {
    throw new Error('no initiator sockets');
  }

  const join = tLen > 1;
  const fork = iLen > 1;

  const _ = genBody();

  _.comment('join:' + tLen + ', fork:' + iLen);

  let req = (!join && fork) ? u.t[0].req : u.i[0].req;
  let ack = (join && !fork) ? u.i[0].ack : u.t[0].ack;

  if (join && fork) {
    req += '_q';
    ack += '_m';
    _.wire({
      1: [req, ack]
    });
  }

  if (join || !fork) {
    _.assign(req, and(u.t.map(e => e.req)));
  }

  if (!join && !fork) {
    _.assign(ack, u.i[0].ack);
  }

  if (fork) {
    const ackR = u.i[0].ack + '_r';
    const reqC = u.i[0].req + '_c';
    const ackS = u.i[0].ack + '_s';
    _.reg({
      [iLen]: [ackR]
    });
    _.wire({
      [iLen]: [reqC, ackS]
    });
    _.assign(
      reqC,
      and([
        '~' + ackR,
        repeat(req, iLen)
      ])
    );
    _.assign(
      concat(u.i.map(e => e.req)),
      reqC
    );
    _.assign(
      ackS,
      or([
        concat(u.i.map(e => e.ack)),
        '~' + reqC
      ])
    );
    _.assign(ack, '&' + ackS);
    _.ff(
      ackR,
      and([
        ackS,
        '~' + repeat(ack, iLen)
      ]),
      iLen
    );
  }

  if (join) u.t.map((rhs, i) =>
    _.assign(rhs.ack, and(
      u.t.reduce((a, lhs, j) =>
        a.concat((i !== j) ? [lhs.req] : []), [ack]))));

  return _.toString();
};

module.exports = mimo;
