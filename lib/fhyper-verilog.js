'use strict';

const operators = require('./operators');
const indent = '    ';

function gLabel (g) {
    return g.label || 'g';
}

function vectorDim (size) {
    const body = (Math.abs(size) > 1) ? '[' + (Math.abs(size) - 1) + ':0]' : '';
    return ((' ').repeat(20) + body + ' ').slice(-8);
}

function vport (desc) {
    return Object.keys(desc).map(function (key, i, arr) {
        const val = desc[key];
        const type = (val < 0) ? 'output logic ' : 'input        ';
        const comma = (i === (arr.length - 1)) ? '' : ',';
        return indent + type + vectorDim(val) + key + comma;
    });
}

function vlogic (desc) {
    return Object.keys(desc).map(function (key, i, arr) {
        const val = desc[key];
        const type = 'logic ';
        return indent + type + vectorDim(val) + key + ';';
    });
}

function edgeWidth (e) {
    if (e.label) {
        switch (typeof e.label) {
        case 'number':
            return e.label;
        case 'object':
            if (typeof e.label.width === 'number') {
                return e.label.width;
            }
        }
    }
}

function pbind (desc) {
    return Object.keys(desc).map(function (key, i, arr) {
        const comma = (i === (arr.length - 1)) ? '' : ',';
        const val = (desc[key] === 1) ? key : desc[key];
        return '    .' + key + '(' + val + ')' + comma;
    });
}

function ioReducer (g, ocb) {
    return g.nodes.reduce(function (res, n, ni) {
        if (n.from.length === 0) { // input edges
            n.to.reduce(ocb.target(ni), res);
        }
        if (n.to.length === 0) { // output edges
            n.from.reduce(ocb.initiator(ni), res);
        }
        return res;
    }, {clk: 'clk', reset_n: 'reset_n'});
}

function dport (g) {
    return vport(ioReducer(g, {
        target: ni => (eres, e) => {
            eres['t' + ni + '_dat'] = edgeWidth(e);
            eres['t' + ni + '_req'] = 1;
            eres['t' + ni + '_ack'] = -1;
            return eres;
        },
        initiator: ni => (eres, e) => {
            eres['i' + ni + '_dat'] = -edgeWidth(e);
            eres['i' + ni + '_req'] = -1;
            eres['i' + ni + '_ack'] = 1;
            return eres;
        }
    }));
}

function cport (g) {
    return vport(ioReducer(g, {
        target: ni => (eres, e) => {
            eres['t' + ni + '_req'] = 1;
            eres['t' + ni + '_ack'] = -1;
            return eres;
        },
        initiator: ni => (eres, e) => {
            eres['i' + ni + '_req'] = -1;
            eres['i' + ni + '_ack'] = 1;
            return eres;
        }
    }));
}

function dlogic (g) {
    return vlogic(g.edges.reduce(function (eres, e, ei) {
        let ename = 'e' + ei;
        ename += (e.label.capacity ? (', ' + ename + '_nxt') : '');
        eres[ename] = e.label.width;
        return eres;
    }, {}));
}

function dcomb (g) {
    return ['\nalways_comb begin']
        .concat(g.edges.reduce(function (eres, e, ei) {
            const n = e.source.node;
            const op = n.label;
            const ename = 'e' + ei + (e.label.capacity ? '_nxt' : '    ');
            const args = n.from.map(function (ee) {
                let eeeres = 'x';
                g.edges.some(function (eee, eeei) {
                    if (ee === eee) {
                        eeeres = 'e' + eeei;
                        return true;
                    }
                });
                return eeeres;
            });
            const expr = (args.length === 0)
                ? 't' + ei + '_dat'
                : (operators[op] || operators.nop)(args);
            const stmt = indent + ename + ' = ' + expr + ';';
            return eres.concat(stmt);
        }, []))
        .concat(g.nodes.reduce(function (res, n, ni) {
            if (n.to.length === 0) {
                n.from.forEach(e => {
                    g.edges.some((ee, eei) => {
                        if (ee === e) {
                            res = res.concat([
                                indent + 'i' + ni + '_dat = e' + eei + ';'
                            ]);
                            return true;
                        }
                    })
                });
            }
            return res;
        }, []))
        .concat(['end\n']);
}

function dff (g) {
    return ['always_ff @(posedge clk) begin']
        .concat(
            g.edges.reduce(function (eres, e, ei) {
                const ename = 'e' + ei;
                if (e.label.capacity) {
                    return eres.concat(indent + ename + ' <= ' + ename + '_nxt;');
                }
                return eres;
            }, [])
        )
        .concat('end\n');
}

function ctrlInstance (g) {
    const glabel = gLabel(g);
    const body = ioReducer(g, {
        target: ni => (eres, e, ei) => {
            eres['t' + ni + '_req'] = 1;
            eres['t' + ni + '_ack'] = 1;
            return eres;
        },
        initiator: ni => (eres, e, ei) => {
            eres['i' + ni + '_req'] = 1;
            eres['i' + ni + '_ack'] = 1;
            return eres;
        }
    })
    return [glabel + '_ctrl uctrl ( // ' + g.nodes.length]
        .concat(pbind(body))
        .concat([');']);
}

function topModule (g) {
    const glabel = gLabel(g);
    return ['module ' + glabel + ' (']
        .concat(dport(g))
        .concat(');')
        .concat(dlogic(g))
        .concat(dcomb(g))
        .concat(dff(g))
        .concat(ctrlInstance(g))
        .concat('endmodule // ' + glabel + '\n');
}

function ctrlModule (g) {
    const glabel = gLabel(g);
    return ['module ' + glabel + '_ctrl (']
        .concat(cport(g))
        .concat(');')
        .concat('// ' + g.nodes.length)
        .concat('endmodule // ' + glabel + '_ctrl\n');
}

module.exports = function (g) {
    return topModule(g)
        .concat(ctrlModule(g))
        .join('\n');
};
