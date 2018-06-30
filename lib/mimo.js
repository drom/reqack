'use strict';

// Multiple Inputs Multiple Outputs (MIMO) controller

const assign = (lhs, rhs) => 'assign ' + lhs + ' = ' + rhs;

// const ff = (lhs, rhs) =>
//     'always @(posedge clk or negedge reset_n) if (~reset_n) ' +
//     lhs + ' <= 1\'b0; else ' +
//     lhs + ' <= ' + rhs;

const wire = names => ['wire ' + names.join(', ')];
const reg  = names => ['reg ' + names.join(', ')];

const op = o => nodes => nodes.join(o);
const and = op(' & ');

const mimo = u => {
    if (u.t.length < 1) { throw new Error('no targets sockets'); }
    if (u.i.length < 1) { throw new Error('no initiator sockets'); }

    const req = (u.i.length > 1)
        ? u.t[0].req + ((u.t.length > 1) ? '_r' : '')
        : u.i[0].req;

    const ack = u.t[0].ack + ((u.t.length > 1) ? '_m' : '');

    return []
        .concat('// ' + u.t.length + ' join, ' + u.i.length + ' fork')
        // W1
        .concat((u.t.length > 1) ? wire([req]) : [])
        // W2
        .concat((u.i.length > 1) ? reg(u.i.map(e => e.ack + '_r')) : [])
        // A1
        .concat((u.t.length > 1) ? assign(req, and(u.t.map(e => e.req))) : [])
        // A2
        .concat((u.i.length > 1)
            ? u.i.map(e => assign(e.req, and([req, e.ack + ''])))
            : assign(u.i[0].req, req))

        // A5
        .concat()
        // A6
        .concat((u.t.length > 1)
            ? u.t.map((rhs, i) =>
                assign(rhs.ack, and(
                    u.t.reduce((a, lhs, j) =>
                        a.concat((i !== j) ? [lhs.ack] : []), [ack])
                ))
            ) : [])
        .map(l => l + ';')
        .join('\n');
};

module.exports = mimo;
