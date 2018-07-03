'use strict';

// Multiple Inputs Multiple Outputs (MIMO) controller

const vectorDim = require('./vector-dim');

const assign = (lhs, rhs) => 'assign ' + lhs + ' = ' + rhs;

const ff = (lhs, rhs) =>
    'always @(posedge clk or negedge reset_n) if (~reset_n) ' +
    lhs + ' <= \'b0; else ' +
    lhs + ' <= ' + rhs;

const wire = list =>
    Object.keys(list).map(dim =>
        'wire ' + vectorDim(dim) + list[dim].join(', '));

const reg = list =>
    Object.keys(list).map(dim =>
        'reg  ' + vectorDim(dim) + list[dim].join(', '));

const concat = list => '{' + list.reverse().join(', ') + '}';

const op = o => nodes => nodes.join(o);
const and = op(' & ');
const or  = op(' | ');

const mimo = u => {
    if (u.t.length < 1) { throw new Error('no targets sockets'); }
    if (u.i.length < 1) { throw new Error('no initiator sockets'); }

    const req = (u.i.length > 1)
        ? u.t[0].req + ((u.t.length > 1) ? '_q' : '')
        : u.i[0].req;

    const ack = u.t[0].ack + ((u.t.length > 1) ? '_m' : '');

    return []
        .concat('// ' + u.t.length + ' join, ' + u.i.length + ' fork')

        .concat((u.i.length > 1) ? reg({[u.i.length]: [u.i[0].ack + '_r']}) : [])
        .concat((u.t.length > 1) ? wire({1: [req]}) : [])
        .concat((u.i.length > 1) ? wire({[u.i.length]: [
            u.i[0].ack + '_s',
            u.i[0].req + '_c'
        ]}) : [])
        // A1
        .concat((u.t.length > 1) ? assign(req, and(u.t.map(e => e.req))) : [])

        // A2
        .concat((u.i.length > 1)
            ? assign(
                u.i[0].ack + '_c',
                and([u.i[0].ack + '_r', '{' + (u.t.length) + '{' + req + '}}'])
            ) : [])
        .concat((u.i.length > 1)
            ? assign(concat(u.i.map(e => e.req)), u.i[0].req + '_c') : [])

        // a3
        .concat((u.i.length > 1)
            ? assign(u.i[0].ack + '_s', or([
                concat(u.i.map(e => e.ack)),
                '~' + u.i[0].req + '_c'
            ])) : [])
        // a4
        .concat(assign(ack, and(u.i.map(e => e.ack + '_s'))))
        // A5
        .concat((u.i.length > 1)
            ? ff(
                u.i[0].ack + '_r',
                and([
                    u.i[0].ack + '_s',
                    '{' + (u.i.length) + '{' + ack + '}}'
                ])
            )
            : []
        )
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
