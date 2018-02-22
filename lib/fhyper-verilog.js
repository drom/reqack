'use strict';

const operators = require('./operators');
const templates = require('../templates');

const indent = '    ';

const enPrefix  = id => 'en' + id;

const datPrefix = id => 'dat' + id;
const reqPrefix = id => 'req' + id;
const ackPrefix = id => 'ack' + id;

const datSuffix = id => id + '_dat';
const reqSuffix = id => id + '_req';
const ackSuffix = id => id + '_ack';

const assign = (lhs, rhs) => ['assign ' + lhs + ' = ' + rhs + ';'];

function edgeIndex (g, edge) {
    let index;
    g.edges.some((e, i) => {
        if (edge === e) {
            index = i;
            return true;
        }
    });
    return index;
}

function gLabel (g) {
    return g.label || 'g';
}

function vectorDim (size) {
    const body = (Math.abs(size) > 1) ? '[' + (Math.abs(size) - 1) + ':0]' : '';
    return ((' ').repeat(20) + body + ' ').slice(-8);
}

function vport (desc) {
    return Object.keys(desc).map((key, i, arr) => {
        const val = desc[key];
        const type = (val < 0) ? 'output logic ' : 'input        ';
        const comma = (i === (arr.length - 1)) ? '' : ',';
        return indent + type + vectorDim(val) + key + comma;
    });
}

function vlogic (desc) {
    return Object.keys(desc).map(key => {
        const val = desc[key];
        const type = 'logic ';
        return type + vectorDim(val) + key + ';';
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

const ioReducer = (g, ocb) =>
    g.nodes.reduce((res, n, nname) => {
        if (n.from.length === 0) { // target node
            const ewidth = edgeWidth(n.to[0]);
            return ocb.target(res, nname, ewidth);
        }
        if (n.to.length === 0) { // initiator node
            const ewidth = edgeWidth(n.from[0]);
            return ocb.initiator(res, nname, ewidth);
        }
        return res;
    }, {clk: 1, reset_n: 1});

function dport (g) {
    return vport(ioReducer(g, {
        target: (res, nname, ewidth) => {
            res[datSuffix('t_' + nname)] = ewidth;
            res[reqSuffix('t_' + nname)] = 1;
            res[ackSuffix('t_' + nname)] = -1;
            return res;
        },
        initiator: (res, nname, ewidth) => {
            res[datSuffix('i_' + nname)] = -ewidth;
            res[reqSuffix('i_' + nname)] = -1;
            res[ackSuffix('i_' + nname)] = 1;
            return res;
        }
    }));
}

function cport (g) {
    const io = ioReducer(g, {
        target: (res, nname) => {
            res[reqSuffix('t_' + nname)] = 1;
            res[ackSuffix('t_' + nname)] = -1;
            return res;
        },
        initiator: (res, nname) => {
            res[reqSuffix('i_' + nname)] = -1;
            res[ackSuffix('i_' + nname)] = 1;
            return res;
        }
    });
    const ioEn = g.edges.reduce(function (eres, e, ei) {
        if (e.label.capacity === 1) {
            eres[enPrefix(ei)] = -1;
        } else
        if (e.label.capacity === 2) {
            eres[enPrefix(ei) + '_0'] = -1;
            eres[enPrefix(ei) + '_1'] = -1;
            eres['sel' + ei] = -1;
        }
        return eres;
    }, io);
    return vport(ioEn);
}

const cForks = g =>
    g.edges.reduce((res, e, ei) => (
        res
            .concat(templates['eb_ctrl.macro.v']({
                id: ei,
                capacity: e.label.capacity,
                t: {
                    valid: 'req' + ei,
                    ready: 'ack' + ei
                },
                i: {
                    valid: 'req' + ei + 'm',
                    ready: 'ack' + ei + 'm'
                }
            }))
            .concat(templates['fork.ctrl.macro.v']({id: ei, targets: e.targets}))
    ), []);

const cTargets = g =>
    g.nodes.reduce((res, n, ni) => (
        res.concat((n.from.length === 0) ? (
            ['// target node: ' + ni]
                .concat(n.to.reduce((eres, e) => {
                    const idx = findGlobalIndexOfEdge(g, e);
                    return eres
                        .concat(assign(reqPrefix(idx), reqSuffix('t_' + ni)))
                        .concat(assign(ackSuffix('t_' + ni), ackPrefix(idx)));
                }, []))
        ) : [])
    ), []);

const cInitiators = g =>
    g.nodes.reduce((res, n, ni) => (
        res.concat((n.to.length === 0) ? (
            ['// initiator node: ' + ni]
                .concat(n.from.reduce((eres, efrom) => {
                    const idx = findGlobalIndexOfEdge(g, efrom);
                    return eres
                        .concat(assign(reqSuffix('i_' + ni), reqPrefix(idx)))
                        .concat(assign(
                            ackPrefix(idx + '_' + findIndexOfNode(g, efrom.targets, n)),
                            ackSuffix('i_' + ni)
                        ));
                }, []))
        ) : [])
    ), []);

const cJoins = g =>
    g.nodes.reduce((res, n, ni) => {
        if (n.from.length > 0 && n.to.length > 0) { // not IO node
            res = res.concat(['// join node:' + ni]);
            // req path
            n.to.forEach(eto => {
                res = res.concat(assign(
                    reqPrefix(findGlobalIndexOfEdge(g, eto)),
                    n.from.map(efrom =>
                        reqPrefix(
                            findGlobalIndexOfEdge(g, efrom) + '_' + findIndexOfNode(g, efrom.targets, n)
                        )
                    ).join(' & ')
                ));
            });

            n.to.forEach(to => {
                const iEdgeTo = edgeIndex(g, to);
                n.from.forEach((from, ifrom) => {
                    const idFrom = edgeIndex(g, from) + '_' + findIndexOfNode(g, from.targets, n);
                    const rest = n.from.reduce((res2, from2, ifrom2) => {
                        if (ifrom === ifrom2) {
                            res2 = res2.concat([
                                reqPrefix(edgeIndex(g, from2) + '_' + findIndexOfNode(g, from2.targets, n))
                            ]);
                        }
                        return res2;
                    }, []).join(' & ');
                    res = res.concat(assign(
                        ackPrefix(idFrom),
                        ackPrefix(iEdgeTo) + ' & (' + rest + ')'
                    ));
                });
            });
        }
        return res;
    }, []);


function findIndexOfNode (g, nodes, node) {
    let index;
    nodes.some((n, ni) => {
        if (node === n.node) {
            index = ni;
            return true;
        }
    });
    return index;
}

function findGlobalIndexOfNode (g, node) {
    let index;
    g.nodes.some((n, ni) => {
        if (node === n) {
            index = ni;
            return true;
        }
    });
    return index;
}

function findGlobalIndexOfEdge (g, edge) {
    let index;
    g.edges.some((e, ei) => {
        if (edge === e) {
            index = ei;
            return true;
        }
    });
    return index;
}

const clogic = g =>
    ['// per edge'].concat(vlogic(
        g.edges.reduce(function (eres, e, ei) {
            let tres = [
                reqPrefix(ei),
                ackPrefix(ei)
            ];
            e.targets.forEach((t, ti) => {
                tres = tres.concat([
                    ackPrefix(ei + '_' + ti),
                    ackPrefix(ei + '_' + ti + '_r'),
                    reqPrefix(ei + '_' + ti)
                ]);
            });

            eres[tres.join(', ')] = 1;
            return eres;
        }, {})
    ));

const dlogic = g => ['// per edge']
    .concat(vlogic(g.edges.reduce(function (eres, e, ei) {
        let ename = datPrefix(ei);
        if (e.label.capacity === 1) {
            eres[[
                ename,
                ename + '_nxt'
            ].join(', ')] = e.label.width;
            eres[enPrefix(ei)] = 1;
        } else
        if (e.label.capacity === 2) {
            eres[[
                ename,
                ename + '_nxt',
                ename + '_r0',
                ename + '_r1'
            ].join(', ')] = e.label.width;
            eres[[
                enPrefix(ei) + '_0',
                enPrefix(ei) + '_1',
                'sel' + ei
            ].join(', ')] = 1;
        } else {
            eres[ename] = e.label.width;
        }
        return eres;
    }, {})));

const dcomb = g => ['// per edge']
    .concat(g.edges.reduce((eres, e, ei) => {
        const n = e.source.node;
        const op = n.label;
        const dat = datPrefix(ei);
        const ename = dat + (e.label.capacity ? '_nxt' : '    ');
        if (e.label.capacity === 2) {
            eres = eres.concat(assign(
                dat,
                `sel${ei} ? ${dat}_r1 : ${dat}_r0`
            ));
        }
        const args = n.from.map(ee => {
            let eeeres = 'x';
            g.edges.some((eee, eeei) => {
                if (ee === eee) {
                    eeeres = datPrefix(eeei);
                    return true;
                }
            });
            return {name: eeeres, width: ee.label.width};
        });

        if (op) {
            if (operators[op]) {
                const expr = (args.length === 0)
                    ? datSuffix('t_' + findGlobalIndexOfNode(g, n))
                    : operators[op](args);
                eres = eres.concat(assign(ename, expr));
            } else {
                eres = eres.concat(
                    [op + '_' + n.from.length + '_' + n.to.length + ' #(']
                        .concat(
                            n.from.map((e, ei) => ({
                                name: 'T_' + ei,
                                width: e.label.width
                            })).concat(n.to.map((e, ei) => ({
                                name: 'I_' + ei,
                                width: e.label.width
                            }))).map(e =>
                                indent + '.' + e.name + '_WIDTH(' + e.width + ')'
                            ).join(',\n')
                        )
                        .concat(') u' + ei + ' (')
                        .concat(
                            n.from.map((e, ei) => ({
                                port: 't_' + ei + '_data',
                                sig: datPrefix(findGlobalIndexOfEdge(g, e))
                            })).concat(n.to.map((e, ei) => ({
                                port: 'i_' + ei + '_data',
                                sig: datPrefix(findGlobalIndexOfEdge(g, e)) + (e.label.capacity ? '_nxt' : '')
                            }))).map(e =>
                                indent + '.' + e.port + '(' + e.sig + ')'
                            ).join(',\n')
                        )
                        .concat(');')
                );
            }
        } else {
            const expr = (args.length === 0)
                ? datSuffix('t_' + findGlobalIndexOfNode(g, n))
                : operators[op](args);
            eres = eres.concat(assign(ename, expr));
        }
        return eres;
    }, []))
    .concat(g.edges.reduce((eres, e, ei) => {
        const ename = datPrefix(ei);
        return eres.concat(e.targets.reduce((nres, n) => {
            return nres.concat((n.node.to.length === 0)
                ? assign(
                    'i_' + datSuffix(findGlobalIndexOfNode(g, n.node)),
                    ename
                ) : []
            );
        }, []));
    }, []));

const dff = g => ['// per edge']
    .concat(['always_ff @(posedge clk) begin'])
    .concat(
        g.edges.reduce(function (eres, e, ei) {
            const edgeNname = datPrefix(ei);
            if (e.label.capacity == 1) {
                return eres.concat([
                    indent + 'if (' + enPrefix(ei) + ') ' + edgeNname + ' <= ' + edgeNname + '_nxt;'
                ]);
            } else
            if (e.label.capacity == 2) {
                return eres.concat([
                    indent + 'if (' + enPrefix(ei) + '_0) ' + edgeNname + '_r0 <= ' + edgeNname + '_nxt;',
                    indent + 'if (' + enPrefix(ei) + '_1) ' + edgeNname + '_r1 <= ' + edgeNname + '_nxt;'
                ]);
            }
            return eres;
        }, [])
    )
    .concat('end\n');

function ctrlInstance (g) {
    const glabel = gLabel(g);

    const io = ioReducer(g, {
        target: (res, nname) => {
            res[reqSuffix('t_' + nname)] = 1;
            res[ackSuffix('t_' + nname)] = 1;
            return res;
        },
        initiator: (res, nname) => {
            res[reqSuffix('i_' + nname)] = 1;
            res[ackSuffix('i_' + nname)] = 1;
            return res;
        }
    });

    const ioEn = g.edges.reduce(function (eres, e, ei) {
        if (e.label.capacity === 1) {
            eres[enPrefix(ei)] = 1;
        } else
        if (e.label.capacity === 2) {
            eres[enPrefix(ei) + '_0'] = 1;
            eres[enPrefix(ei) + '_1'] = 1;
            eres['sel' + ei] = 1;
        }
        return eres;
    }, io);

    return [glabel + '_ctrl uctrl (']
        .concat(pbind(ioEn))
        .concat([');']);
}

function topModule (g) {
    const glabel = gLabel(g);
    return ['module ' + glabel + ' (']
        .concat([indent + '// per node (target / initiator)'])
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
        .concat([indent + '// per node (target / initiator)'])
        .concat(cport(g))
        .concat(');')
        .concat(clogic(g))
        .concat(cTargets(g))
        .concat(cForks(g))
        .concat(cJoins(g))
        .concat(cInitiators(g))
        // .concat(cBuffers(g));
        .concat('endmodule // ' + glabel + '_ctrl\n');
}

module.exports = function (g) {
    return topModule(g)
        .concat(ctrlModule(g))
        .join('\n');
};
